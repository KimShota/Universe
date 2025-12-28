from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Emergent Auth URL
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# ==================== PYDANTIC MODELS ====================

# User Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    streak: int = 0
    coins: int = 0
    current_planet: int = 0
    last_post_date: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

# Main Page / Mission Models
class Mission(BaseModel):
    user_id: str
    date: str
    completed: bool = False
    created_at: datetime

# SOS Models
class SOSCompletion(BaseModel):
    user_id: str
    issue_type: str
    asteroids: List[str]
    affirmations: List[str]
    completed_at: datetime

# Creator's Universe Models
class CreatorUniverse(BaseModel):
    user_id: str
    overarching_goal: str = ""
    content_pillars: List[Dict[str, Union[str, List[str]]]] = []
    updated_at: datetime

# Content Tips Models
class ContentTipsProgress(BaseModel):
    user_id: str
    tip_id: str
    quiz_completed: bool = False
    quiz_score: Optional[int] = None
    completed_at: Optional[datetime] = None

# Request/Response Models
class SessionDataResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class LoginResponse(BaseModel):
    user: User
    session_token: str

class MissionCompleteRequest(BaseModel):
    date: str

class SOSCompleteRequest(BaseModel):
    issue_type: str
    asteroids: List[str]
    affirmations: List[str]

class UpdateCreatorUniverseRequest(BaseModel):
    overarching_goal: Optional[str] = None
    content_pillars: Optional[List[Dict]] = None

class QuizCompleteRequest(BaseModel):
    tip_id: str
    score: int

# ==================== AUTH HELPERS ====================

async def get_current_user(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
) -> User:
    """Get current user from session token (cookie or Authorization header)"""
    token = session_token
    
    # Fallback to Authorization header if no cookie
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session = await db.user_sessions.find_one(
        {"session_token": token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if session is expired (timezone-aware comparison)
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user from database
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session", response_model=LoginResponse)
async def exchange_session(session_id: str, response: Response):
    """Exchange session_id for user data and session_token"""
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            logging.error(f"Failed to exchange session: {e}")
            raise HTTPException(status_code=400, detail="Invalid session_id")
    
    # Parse response
    session_data = SessionDataResponse(**user_data)
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": session_data.email},
        {"_id": 0}
    )
    
    if existing_user:
        user = User(**existing_user)
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = User(
            user_id=user_id,
            email=session_data.email,
            name=session_data.name,
            picture=session_data.picture,
            streak=0,
            coins=0,
            current_planet=0,
            created_at=datetime.now(timezone.utc)
        )
        
        await db.users.insert_one(user.dict())
        
        # Initialize Creator's Universe
        creator_universe = CreatorUniverse(
            user_id=user_id,
            overarching_goal="",
            content_pillars=[
                {"title": "Content Pillar 1", "ideas": []},
                {"title": "Content Pillar 2", "ideas": []},
                {"title": "Content Pillar 3", "ideas": []},
                {"title": "Content Pillar 4", "ideas": []}
            ],
            updated_at=datetime.now(timezone.utc)
        )
        await db.creator_universe.insert_one(creator_universe.dict())
    
    # Create or update session
    await db.user_sessions.delete_many({"user_id": user.user_id})
    
    session = UserSession(
        user_id=user.user_id,
        session_token=session_data.session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        created_at=datetime.now(timezone.utc)
    )
    
    await db.user_sessions.insert_one(session.dict())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_data.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/"
    )
    
    return LoginResponse(user=user, session_token=session_data.session_token)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    """Logout user"""
    await db.user_sessions.delete_many({"user_id": current_user.user_id})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== USER ROUTES ====================

@api_router.get("/user/profile", response_model=User)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get user profile with streak and coins"""
    return current_user

# ==================== MISSION ROUTES ====================

@api_router.post("/mission/complete")
async def complete_mission(
    request: MissionCompleteRequest,
    current_user: User = Depends(get_current_user)
):
    """Mark daily mission as complete"""
    
    today = request.date
    
    # Check if mission already completed today
    existing_mission = await db.missions.find_one(
        {"user_id": current_user.user_id, "date": today},
        {"_id": 0}
    )
    
    if existing_mission and existing_mission.get("completed"):
        raise HTTPException(status_code=400, detail="Mission already completed today")
    
    # Mark mission complete
    if existing_mission:
        await db.missions.update_one(
            {"user_id": current_user.user_id, "date": today},
            {"$set": {"completed": True}}
        )
    else:
        mission = Mission(
            user_id=current_user.user_id,
            date=today,
            completed=True,
            created_at=datetime.now(timezone.utc)
        )
        await db.missions.insert_one(mission.dict())
    
    # Update user progress
    update_data = {
        "coins": current_user.coins + 10,
        "current_planet": current_user.current_planet + 1,
        "last_post_date": today
    }
    
    # Update streak
    if current_user.last_post_date:
        from datetime import datetime
        last_date = datetime.fromisoformat(current_user.last_post_date)
        today_date = datetime.fromisoformat(today)
        days_diff = (today_date - last_date).days
        
        if days_diff == 1:
            # Consecutive day
            update_data["streak"] = current_user.streak + 1
        elif days_diff > 1:
            # Streak broken
            update_data["streak"] = 1
    else:
        # First post
        update_data["streak"] = 1
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return {
        "message": "Mission completed!",
        "coins_earned": 10,
        "user": User(**updated_user)
    }

@api_router.get("/mission/today")
async def get_today_mission(current_user: User = Depends(get_current_user)):
    """Get today's mission status"""
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    mission = await db.missions.find_one(
        {"user_id": current_user.user_id, "date": today},
        {"_id": 0}
    )
    
    if mission:
        return {"completed": mission.get("completed", False), "date": today}
    
    return {"completed": False, "date": today}

# ==================== SOS ROUTES ====================

@api_router.post("/sos/complete")
async def complete_sos(
    request: SOSCompleteRequest,
    current_user: User = Depends(get_current_user)
):
    """Complete SOS flow"""
    
    # Save SOS completion
    sos_completion = SOSCompletion(
        user_id=current_user.user_id,
        issue_type=request.issue_type,
        asteroids=request.asteroids,
        affirmations=request.affirmations,
        completed_at=datetime.now(timezone.utc)
    )
    
    await db.sos_completions.insert_one(sos_completion.dict())
    
    # Award coins
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$inc": {"coins": 10}}
    )
    
    # Get updated user
    updated_user = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return {
        "message": "SOS completed! You've earned 10 coins.",
        "coins_earned": 10,
        "user": User(**updated_user)
    }

@api_router.get("/sos/history")
async def get_sos_history(current_user: User = Depends(get_current_user)):
    """Get user's SOS completion history"""
    
    history = await db.sos_completions.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(100)
    
    return {"history": history}

# ==================== CREATOR'S UNIVERSE ROUTES ====================

@api_router.get("/creator-universe")
async def get_creator_universe(current_user: User = Depends(get_current_user)):
    """Get user's creator universe"""
    
    universe = await db.creator_universe.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not universe:
        # Create default
        universe = CreatorUniverse(
            user_id=current_user.user_id,
            overarching_goal="",
            content_pillars=[
                {"title": "Content Pillar 1", "ideas": []},
                {"title": "Content Pillar 2", "ideas": []},
                {"title": "Content Pillar 3", "ideas": []},
                {"title": "Content Pillar 4", "ideas": []}
            ],
            updated_at=datetime.now(timezone.utc)
        )
        await db.creator_universe.insert_one(universe.dict())
    
    return universe

@api_router.put("/creator-universe")
async def update_creator_universe(
    request: UpdateCreatorUniverseRequest,
    current_user: User = Depends(get_current_user)
):
    """Update creator universe"""
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if request.overarching_goal is not None:
        update_data["overarching_goal"] = request.overarching_goal
    
    if request.content_pillars is not None:
        update_data["content_pillars"] = request.content_pillars
    
    await db.creator_universe.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    # Get updated universe
    universe = await db.creator_universe.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return universe

# ==================== CONTENT TIPS ROUTES ====================

@api_router.post("/content-tips/quiz")
async def complete_quiz(
    request: QuizCompleteRequest,
    current_user: User = Depends(get_current_user)
):
    """Complete content tip quiz"""
    
    # Check if already completed
    existing = await db.content_tips_progress.find_one(
        {"user_id": current_user.user_id, "tip_id": request.tip_id},
        {"_id": 0}
    )
    
    if existing and existing.get("quiz_completed"):
        return {
            "message": "Quiz already completed",
            "coins_earned": 0
        }
    
    # Save progress
    progress = ContentTipsProgress(
        user_id=current_user.user_id,
        tip_id=request.tip_id,
        quiz_completed=True,
        quiz_score=request.score,
        completed_at=datetime.now(timezone.utc)
    )
    
    if existing:
        await db.content_tips_progress.update_one(
            {"user_id": current_user.user_id, "tip_id": request.tip_id},
            {"$set": progress.dict()}
        )
    else:
        await db.content_tips_progress.insert_one(progress.dict())
    
    # Award coins
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$inc": {"coins": 10}}
    )
    
    # Get updated user
    updated_user = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return {
        "message": "Quiz completed! You've earned 10 coins.",
        "coins_earned": 10,
        "user": User(**updated_user)
    }

@api_router.get("/content-tips/progress")
async def get_content_tips_progress(current_user: User = Depends(get_current_user)):
    """Get user's content tips progress"""
    
    progress = await db.content_tips_progress.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"progress": progress}

# ==================== INCLUDE ROUTER ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
