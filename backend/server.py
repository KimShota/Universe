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
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError(
        "MONGO_URL environment variable is not set. "
        "Please create a .env file in the backend directory with MONGO_URL=mongodb://localhost:27017"
    )

db_name = os.environ.get('DB_NAME')
if not db_name:
    raise ValueError(
        "DB_NAME environment variable is not set. "
        "Please create a .env file in the backend directory with DB_NAME=universe"
    )

import certifi
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[db_name]

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
    avatar: Optional[Dict] = None
    identity: Optional[Dict] = None
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
    id: str
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
    avatar: Optional[Dict] = None
    identity: Optional[Dict] = None

class AnalysisEntry(BaseModel):
    id: str
    title: Optional[str] = None
    reelLink: str = ""
    views: str = ""
    visualHook: str = ""
    textHook: str = ""
    format: str = ""
    duration: str = ""
    textDuration: str = ""
    pacing: str = ""
    audio: str = ""
    storyArc: str = ""
    callToAction: str = ""
    notes: str = ""
    date: Optional[str] = None

class AnalysisEntryRequest(BaseModel):
    entry: AnalysisEntry

class UpdateScheduleRequest(BaseModel):
    schedule: Dict[str, Dict[str, str]]  # { "Monday": { "idea": "", "format": "" }, ... }

class QuizCompleteRequest(BaseModel):
    tip_id: str
    score: int

class Script(BaseModel):
    id: str
    title: Optional[str] = ""
    mission: Optional[str] = ""
    titleHook: Optional[str] = ""
    visualHook: Optional[str] = ""
    verbalHook: Optional[str] = ""
    problem: Optional[str] = ""
    promise: Optional[str] = ""
    credibility: Optional[str] = ""
    delivery: Optional[str] = ""
    callToAction: Optional[str] = ""
    footageNeeded: Optional[str] = ""
    audio: Optional[str] = ""
    caption: Optional[str] = ""
    textVisual: Optional[str] = ""
    date: Optional[str] = None

class ScriptRequest(BaseModel):
    script: Script

class StoryFinderRow(BaseModel):
    id: str
    problem: str = ""
    pursuit: str = ""
    payoff: str = ""
    your_story: str = ""

class UpdateStoryFinderRequest(BaseModel):
    rows: List[StoryFinderRow]

# ==================== AUTH HELPERS ====================

async def get_current_user(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
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
    
    try:
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
            except httpx.HTTPStatusError as e:
                logging.error(f"Emergent Auth API returned error: {e.response.status_code} - {e.response.text}")
                raise HTTPException(status_code=400, detail=f"Invalid session_id: Auth API returned {e.response.status_code}")
            except httpx.RequestError as e:
                logging.error(f"Failed to connect to Emergent Auth API: {e}")
                raise HTTPException(status_code=503, detail="Auth service unavailable")
            except Exception as e:
                logging.error(f"Unexpected error calling Emergent Auth API: {e}")
                raise HTTPException(status_code=400, detail="Invalid session_id")
        
        # Parse response
        try:
            session_data = SessionDataResponse(**user_data)
        except Exception as e:
            logging.error(f"Failed to parse auth response: {e}, data: {user_data}")
            raise HTTPException(status_code=500, detail=f"Failed to parse auth response: {str(e)}")
    except HTTPException:
        # Re-raise HTTP exceptions from auth API calls
        raise
    except Exception as e:
        logging.error(f"Unexpected error in auth exchange: {e}")
        raise HTTPException(status_code=500, detail=f"Auth exchange error: {str(e)}")
    
    # Database operations with error handling
    try:
        # Check if user exists
        existing_user = await db.users.find_one(
            {"email": session_data.email},
            {"_id": 0}
        )
        
        if existing_user:
            try:
                user = User(**existing_user)
            except Exception as e:
                logging.error(f"Failed to parse existing user: {e}, data: {existing_user}")
                raise HTTPException(status_code=500, detail=f"Failed to parse user data: {str(e)}")
        else:
            # Create new user (map id to user_id)
            try:
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
                    avatar=None,
                    identity=None,
                    updated_at=datetime.now(timezone.utc)
                )
                await db.creator_universe.insert_one(creator_universe.dict())
            except Exception as e:
                logging.error(f"Failed to create new user: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
        
        # Create or update session
        try:
            await db.user_sessions.delete_many({"user_id": user.user_id})
            
            session = UserSession(
                user_id=user.user_id,
                session_token=session_data.session_token,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
                created_at=datetime.now(timezone.utc)
            )
            
            await db.user_sessions.insert_one(session.dict())
        except Exception as e:
            logging.error(f"Failed to create session: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logging.error(f"Database error in exchange_session: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
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


@api_router.delete("/auth/account")
async def delete_account(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    """Permanently delete user account and all associated data"""
    user_id = current_user.user_id

    # Delete all user data across collections
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.creator_universe.delete_many({"user_id": user_id})
    await db.analysis_entries.delete_many({"user_id": user_id})
    await db.schedule.delete_many({"user_id": user_id})
    await db.story_finder.delete_many({"user_id": user_id})
    await db.content_tips_progress.delete_many({"user_id": user_id})
    await db.batching_scripts.delete_many({"user_id": user_id})
    await db.missions.delete_many({"user_id": user_id})
    await db.sos_completions.delete_many({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})

    response.delete_cookie(key="session_token", path="/")
    return {"message": "Account deleted successfully"}


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
            avatar=None,
            identity=None,
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
    
    if request.avatar is not None:
        update_data["avatar"] = request.avatar
    
    if request.identity is not None:
        update_data["identity"] = request.identity
    
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

# ==================== ANALYSIS ROUTES ====================

@api_router.get("/analysis/entries")
async def get_analysis_entries(current_user: User = Depends(get_current_user)):
    """Get user's analysis entries"""
    
    entries = await db.analysis_entries.find(
        {"user_id": current_user.user_id},
        {"_id": 0, "user_id": 0}
    ).to_list(100)
    
    return {"entries": entries}

@api_router.post("/analysis/entries")
async def save_analysis_entry(
    request: AnalysisEntryRequest,
    current_user: User = Depends(get_current_user)
):
    """Save analysis entry"""
    
    entry_dict = request.entry.dict()
    entry_dict["user_id"] = current_user.user_id
    
    # Update or insert entry
    await db.analysis_entries.update_one(
        {"user_id": current_user.user_id, "id": request.entry.id},
        {"$set": entry_dict},
        upsert=True
    )
    
    return {"message": "Analysis entry saved successfully", "entry": request.entry}

@api_router.delete("/analysis/entries/{entry_id}")
async def delete_analysis_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete analysis entry"""
    
    # Get all user entries to find the matching one
    all_entries = await db.analysis_entries.find(
        {"user_id": current_user.user_id}
    ).to_list(100)
    
    # Find entry with matching ID (handling type conversion)
    matching_entry = None
    for e in all_entries:
        entry_id_in_db = e.get("id")
        # Try both string and numeric comparison
        if str(entry_id_in_db) == entry_id or (entry_id.isdigit() and entry_id_in_db == int(entry_id)):
            matching_entry = e
            break
    
    if not matching_entry:
        raise HTTPException(status_code=404, detail="Analysis entry not found")
    
    # Delete using the actual ID format from database
    actual_id = matching_entry.get("id")
    result = await db.analysis_entries.delete_one(
        {"user_id": current_user.user_id, "id": actual_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis entry not found")
    
    return {"message": "Analysis entry deleted successfully"}

# ==================== SCHEDULE ROUTES ====================

@api_router.get("/schedule")
async def get_schedule(current_user: User = Depends(get_current_user)):
    """Get user's schedule data"""
    
    schedule = await db.schedule.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not schedule:
        # Create default
        default_schedule = {
            "user_id": current_user.user_id,
            "schedule": {
                "Monday": {"idea": "", "format": ""},
                "Tuesday": {"idea": "", "format": ""},
                "Wednesday": {"idea": "", "format": ""},
                "Thursday": {"idea": "", "format": ""},
                "Friday": {"idea": "", "format": ""},
                "Saturday": {"idea": "", "format": ""},
                "Sunday": {"idea": "", "format": ""},
            },
            "updated_at": datetime.now(timezone.utc)
        }
        await db.schedule.insert_one(default_schedule)
        return default_schedule
    
    return schedule

@api_router.put("/schedule")
async def update_schedule(
    request: UpdateScheduleRequest,
    current_user: User = Depends(get_current_user)
):
    """Update schedule data"""
    
    update_data = {
        "schedule": request.schedule,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Check if schedule exists
    existing = await db.schedule.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if existing:
        await db.schedule.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_data}
        )
    else:
        schedule_data = {
            "user_id": current_user.user_id,
            **update_data
        }
        await db.schedule.insert_one(schedule_data)
    
    # Get updated schedule
    schedule = await db.schedule.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return schedule

# ==================== STORY FINDER ROUTES ====================

@api_router.get("/story-finder")
async def get_story_finder(current_user: User = Depends(get_current_user)):
    """Get user's Story Finder rows"""
    doc = await db.story_finder.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0, "user_id": 0}
    )
    if not doc or "rows" not in doc:
        return {"rows": []}
    return {"rows": doc["rows"]}

@api_router.put("/story-finder")
async def update_story_finder(
    request: UpdateStoryFinderRequest,
    current_user: User = Depends(get_current_user)
):
    """Update Story Finder rows"""
    rows = [r.dict() for r in request.rows]
    update_data = {
        "rows": rows,
        "updated_at": datetime.now(timezone.utc),
    }
    existing = await db.story_finder.find_one({"user_id": current_user.user_id})
    if existing:
        await db.story_finder.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_data}
        )
    else:
        await db.story_finder.insert_one({
            "user_id": current_user.user_id,
            **update_data,
        })
    return {"rows": rows}

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

# ==================== BATCHING ROUTES ====================

@api_router.get("/batching/scripts")
async def get_batching_scripts(current_user: User = Depends(get_current_user)):
    """Get user's batching scripts"""
    
    scripts = await db.batching_scripts.find(
        {"user_id": current_user.user_id},
        {"_id": 0, "user_id": 0}
    ).to_list(100)
    
    return {"scripts": scripts}

@api_router.post("/batching/scripts")
async def save_batching_script(
    request: ScriptRequest,
    current_user: User = Depends(get_current_user)
):
    """Save or update a batching script"""
    
    script_dict = request.script.dict()
    script_dict["user_id"] = current_user.user_id
    
    # Update or insert script
    await db.batching_scripts.update_one(
        {"user_id": current_user.user_id, "id": request.script.id},
        {"$set": script_dict},
        upsert=True
    )
    
    return {"message": "Script saved successfully", "script": request.script}

@api_router.delete("/batching/scripts/{script_id}")
async def delete_batching_script(
    script_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a batching script"""
    
    # Get all user scripts to find the matching one
    all_scripts = await db.batching_scripts.find(
        {"user_id": current_user.user_id}
    ).to_list(100)
    
    # Find script with matching ID (handling type conversion)
    matching_script = None
    for s in all_scripts:
        script_id_in_db = s.get("id")
        # Try both string and numeric comparison
        if str(script_id_in_db) == script_id or (script_id.isdigit() and script_id_in_db == int(script_id)):
            matching_script = s
            break
    
    if not matching_script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    # Delete using the actual ID format from database
    actual_id = matching_script.get("id")
    result = await db.batching_scripts.delete_one(
        {"user_id": current_user.user_id, "id": actual_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Script not found")
    
    return {"message": "Script deleted successfully"}

# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Universe Backend API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint with database status"""
    try:
        # Check MongoDB connection
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

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
