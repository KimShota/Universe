"""
Supabase database layer for Universe backend.
Wraps sync Supabase client with async helpers.
"""
import os
import asyncio
from supabase import create_client, Client
from typing import Any, Optional, List
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set. "
        "Get them from Supabase project Settings > API."
    )

_sb: Optional[Client] = None


def _sb_client() -> Client:
    global _sb
    if _sb is None:
        _sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _sb


async def _run(fn):
    """Run sync Supabase call in thread pool. fn is a callable with no args."""
    return await asyncio.to_thread(fn)


def _serialize_dt(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _strip_id(row: dict) -> dict:
    """Remove 'id' (bigserial) from row for API compatibility."""
    return {k: v for k, v in row.items() if k != "id"}


# --- Users ---
async def user_find_by_email(email: str) -> Optional[dict]:
    r = await _run(lambda: _sb_client().table("users").select("*").eq("email", email).execute())
    if r.data and len(r.data) > 0:
        return _strip_id(dict(r.data[0]))
    return None


async def user_find_by_id(user_id: str) -> Optional[dict]:
    r = await _run(lambda: _sb_client().table("users").select("*").eq("user_id", user_id).execute())
    if r.data and len(r.data) > 0:
        return _strip_id(dict(r.data[0]))
    return None


async def user_insert(data: dict):
    data = {**data}
    if "created_at" in data and hasattr(data["created_at"], "isoformat"):
        data["created_at"] = _serialize_dt(data["created_at"])
    await _run(lambda: _sb_client().table("users").insert(data).execute())


async def user_update(user_id: str, data: dict):
    data = {**data}
    for k in list(data.keys()):
        if isinstance(data[k], datetime):
            data[k] = _serialize_dt(data[k])
    await _run(lambda: _sb_client().table("users").update(data).eq("user_id", user_id).execute())


async def user_increment_coins(user_id: str, delta: int):
    r = await _run(lambda: _sb_client().table("users").select("coins").eq("user_id", user_id).execute())
    if r.data and len(r.data) > 0:
        cur = r.data[0].get("coins", 0) or 0
        await _run(lambda: _sb_client().table("users").update({"coins": cur + delta}).eq("user_id", user_id).execute())


async def user_delete(user_id: str):
    await _run(lambda: _sb_client().table("users").delete().eq("user_id", user_id).execute())


# --- Sessions ---
async def session_find_by_token(token: str) -> Optional[dict]:
    r = await _run(lambda: _sb_client().table("user_sessions").select("*").eq("session_token", token).execute())
    if r.data and len(r.data) > 0:
        d = dict(r.data[0])
        for k in ("expires_at", "created_at"):
            if d.get(k) and isinstance(d[k], str):
                d[k] = datetime.fromisoformat(d[k].replace("Z", "+00:00"))
        return _strip_id(d)
    return None


async def session_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("user_sessions").delete().eq("user_id", user_id).execute())


async def session_insert(data: dict):
    data = {**data}
    for k in ("expires_at", "created_at"):
        if k in data and hasattr(data[k], "isoformat"):
            data[k] = _serialize_dt(data[k])
    await _run(lambda: _sb_client().table("user_sessions").insert(data).execute())


# --- Missions ---
async def mission_find(user_id: str, date: str) -> Optional[dict]:
    r = await _run(lambda: _sb_client().table("missions").select("*").eq("user_id", user_id).eq("date", date).execute())
    if r.data and len(r.data) > 0:
        d = dict(r.data[0])
        if d.get("created_at") and isinstance(d["created_at"], str):
            d["created_at"] = datetime.fromisoformat(d["created_at"].replace("Z", "+00:00"))
        return _strip_id(d)
    return None


async def mission_upsert(data: dict):
    data = {**data}
    if "created_at" in data and hasattr(data["created_at"], "isoformat"):
        data["created_at"] = _serialize_dt(data["created_at"])
    await _run(lambda: _sb_client().table("missions").upsert(data, on_conflict="user_id,date").execute())


async def mission_update_completed(user_id: str, date: str):
    await _run(lambda: _sb_client().table("missions").update({"completed": True}).eq("user_id", user_id).eq("date", date).execute())


async def mission_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("missions").delete().eq("user_id", user_id).execute())


# --- SOS ---
async def sos_insert(data: dict):
    data = {**data}
    data["asteroids"] = data.get("asteroids", [])
    data["affirmations"] = data.get("affirmations", [])
    if "completed_at" in data and hasattr(data["completed_at"], "isoformat"):
        data["completed_at"] = _serialize_dt(data["completed_at"])
    await _run(lambda: _sb_client().table("sos_completions").insert(data).execute())


async def sos_list(user_id: str, limit: int = 100) -> List[dict]:
    r = await _run(
        lambda: _sb_client().table("sos_completions").select("*").eq("user_id", user_id).order("completed_at", desc=True).limit(limit).execute()
    )
    out = []
    for row in r.data or []:
        d = _strip_id(dict(row))
        if d.get("completed_at") and isinstance(d["completed_at"], str):
            d["completed_at"] = datetime.fromisoformat(d["completed_at"].replace("Z", "+00:00"))
        out.append(d)
    return out


async def sos_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("sos_completions").delete().eq("user_id", user_id).execute())


# --- Creator Universe ---
async def creator_universe_find(user_id: str) -> Optional[dict]:
    r = await _run(lambda: _sb_client().table("creator_universe").select("*").eq("user_id", user_id).execute())
    if r.data and len(r.data) > 0:
        d = dict(r.data[0])
        if d.get("updated_at") and isinstance(d["updated_at"], str):
            d["updated_at"] = datetime.fromisoformat(d["updated_at"].replace("Z", "+00:00"))
        return _strip_id(d)
    return None


async def creator_universe_insert(data: dict):
    data = {**data}
    if "updated_at" in data and hasattr(data["updated_at"], "isoformat"):
        data["updated_at"] = _serialize_dt(data["updated_at"])
    await _run(lambda: _sb_client().table("creator_universe").insert(data).execute())


async def creator_universe_update(user_id: str, data: dict):
    data = {**data}
    if "updated_at" in data and hasattr(data["updated_at"], "isoformat"):
        data["updated_at"] = _serialize_dt(data["updated_at"])
    await _run(lambda: _sb_client().table("creator_universe").update(data).eq("user_id", user_id).execute())


async def creator_universe_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("creator_universe").delete().eq("user_id", user_id).execute())


# --- Analysis entries ---
async def analysis_list(user_id: str, limit: int = 100) -> List[dict]:
    r = await _run(lambda: _sb_client().table("analysis_entries").select("*").eq("user_id", user_id).limit(limit).execute())
    out = []
    for row in r.data or []:
        d = dict(row)
        entry_id = d.pop("entry_id", None)
        data = d.pop("data", {}) or {}
        merged = {"id": entry_id, **data}
        out.append(merged)
    return out


async def analysis_upsert(user_id: str, entry_id: str, data: dict):
    payload = {"user_id": user_id, "entry_id": str(entry_id), "data": data}
    await _run(lambda: _sb_client().table("analysis_entries").upsert(payload, on_conflict="user_id,entry_id").execute())


async def analysis_delete(user_id: str, entry_id: str) -> bool:
    r = await _run(lambda: _sb_client().table("analysis_entries").delete().eq("user_id", user_id).eq("entry_id", str(entry_id)).execute())
    return (r.data or []) and len(r.data) > 0


async def analysis_find_all(user_id: str) -> List[dict]:
    r = await _run(lambda: _sb_client().table("analysis_entries").select("*").eq("user_id", user_id).execute())
    return list(r.data or [])


async def analysis_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("analysis_entries").delete().eq("user_id", user_id).execute())


# --- Schedule ---
async def schedule_find(user_id: str) -> Optional[dict]:
    r = await _run(lambda: _sb_client().table("schedule").select("*").eq("user_id", user_id).execute())
    if r.data and len(r.data) > 0:
        d = dict(r.data[0])
        if d.get("updated_at") and isinstance(d["updated_at"], str):
            d["updated_at"] = datetime.fromisoformat(d["updated_at"].replace("Z", "+00:00"))
        return _strip_id(d)
    return None


async def schedule_insert(data: dict):
    data = {**data}
    if "updated_at" in data and hasattr(data["updated_at"], "isoformat"):
        data["updated_at"] = _serialize_dt(data["updated_at"])
    await _run(lambda: _sb_client().table("schedule").insert(data).execute())


async def schedule_upsert(data: dict):
    data = {**data}
    if "updated_at" in data and hasattr(data["updated_at"], "isoformat"):
        data["updated_at"] = _serialize_dt(data["updated_at"])
    await _run(lambda: _sb_client().table("schedule").upsert(data, on_conflict="user_id").execute())


async def schedule_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("schedule").delete().eq("user_id", user_id).execute())


# --- Story finder ---
async def story_finder_find(user_id: str) -> Optional[dict]:
    r = await _run(lambda: _sb_client().table("story_finder").select("*").eq("user_id", user_id).execute())
    if r.data and len(r.data) > 0:
        return _strip_id(dict(r.data[0]))
    return None


async def story_finder_upsert(user_id: str, rows: list, updated_at: datetime):
    payload = {"user_id": user_id, "rows": rows, "updated_at": _serialize_dt(updated_at)}
    await _run(lambda: _sb_client().table("story_finder").upsert(payload, on_conflict="user_id").execute())


async def story_finder_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("story_finder").delete().eq("user_id", user_id).execute())


# --- Content tips progress ---
async def content_tips_find(user_id: str, tip_id: str) -> Optional[dict]:
    r = await _run(
        lambda: _sb_client().table("content_tips_progress").select("*").eq("user_id", user_id).eq("tip_id", tip_id).execute()
    )
    if r.data and len(r.data) > 0:
        d = dict(r.data[0])
        if d.get("completed_at") and isinstance(d["completed_at"], str):
            d["completed_at"] = datetime.fromisoformat(d["completed_at"].replace("Z", "+00:00"))
        return _strip_id(d)
    return None


async def content_tips_insert(data: dict):
    data = {**data}
    if "completed_at" in data and data["completed_at"] and hasattr(data["completed_at"], "isoformat"):
        data["completed_at"] = _serialize_dt(data["completed_at"])
    await _run(lambda: _sb_client().table("content_tips_progress").insert(data).execute())


async def content_tips_update(user_id: str, tip_id: str, data: dict):
    data = {**data}
    if "completed_at" in data and data["completed_at"] and hasattr(data["completed_at"], "isoformat"):
        data["completed_at"] = _serialize_dt(data["completed_at"])
    await _run(
        lambda: _sb_client().table("content_tips_progress").update(data).eq("user_id", user_id).eq("tip_id", tip_id).execute()
    )


async def content_tips_list(user_id: str) -> List[dict]:
    r = await _run(lambda: _sb_client().table("content_tips_progress").select("*").eq("user_id", user_id).execute())
    out = []
    for row in r.data or []:
        d = _strip_id(dict(row))
        if d.get("completed_at") and isinstance(d["completed_at"], str):
            d["completed_at"] = datetime.fromisoformat(d["completed_at"].replace("Z", "+00:00"))
        out.append(d)
    return out


async def content_tips_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("content_tips_progress").delete().eq("user_id", user_id).execute())


# --- Batching scripts ---
async def batching_list(user_id: str) -> List[dict]:
    r = await _run(lambda: _sb_client().table("batching_scripts").select("*").eq("user_id", user_id).execute())
    out = []
    for row in r.data or []:
        d = dict(row)
        script_id = d.pop("script_id", None)
        data = d.pop("data", {}) or {}
        merged = {"id": script_id, **data}
        out.append(merged)
    return out


async def batching_upsert(user_id: str, script_id: str, data: dict):
    payload = {"user_id": user_id, "script_id": str(script_id), "data": data}
    await _run(lambda: _sb_client().table("batching_scripts").upsert(payload, on_conflict="user_id,script_id").execute())


async def batching_find_all(user_id: str) -> List[dict]:
    r = await _run(lambda: _sb_client().table("batching_scripts").select("*").eq("user_id", user_id).execute())
    return list(r.data or [])


async def batching_delete(user_id: str, script_id: str) -> bool:
    r = await _run(lambda: _sb_client().table("batching_scripts").delete().eq("user_id", user_id).eq("script_id", str(script_id)).execute())
    return (r.data or []) and len(r.data) > 0


async def batching_delete_by_user(user_id: str):
    await _run(lambda: _sb_client().table("batching_scripts").delete().eq("user_id", user_id).execute())


# --- Health ---
async def db_ping() -> bool:
    try:
        await _run(lambda: _sb_client().table("users").select("user_id").limit(1).execute())
        return True
    except Exception:
        return False
