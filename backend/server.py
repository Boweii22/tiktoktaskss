from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
supabase_url = os.environ.get('SUPABASE_URL', '').strip()
supabase_key = (os.environ.get('SUPABASE_SERVICE_KEY', '') or os.environ.get('SUPABASE_KEY', '')).strip()
admin_session_ids = set(s.strip() for s in (os.environ.get('ADMIN_SESSION_IDS', '') or '').split(',') if s.strip())
supabase: Optional[Client] = None
if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        logging.warning(f"Supabase init failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Task definitions - these define the impossible tasks
TASKS = [
    {
        "id": "hold3000",
        "name": "Hold",
        "instruction": "Hold for exactly 3.000 seconds. Release too early or too late = fail.",
        "type": "timing",
        "config": {"target": 3000, "tolerance": 15}
    },
    {
        "id": "static_tap",
        "name": "Still",
        "instruction": "Tap in the exact moment the circle freezes. It only freezes for a split second each cycle.",
        "type": "static_tap",
        "config": {"cycle_ms": 4500, "window_ms": 35}
    },
    {
        "id": "shrinking_circle",
        "name": "Catch",
        "instruction": "Drag the dot into the circle before it disappears. Miss = fail.",
        "type": "shrinking_circle",
        "config": {"shrink_rate": 0.94, "min_size": 12}
    },
    {
        "id": "trap_tap",
        "name": "Tap 50",
        "instruction": "Tap 50 times. One tap is a trap — if you hit it you fail and start over.",
        "type": "trap_tap",
        "config": {"required_taps": 50, "trap_position": -1}
    },
    {
        "id": "balance_shape",
        "name": "Balance",
        "instruction": "Keep the block centered for 5 seconds. Let it drift too far = fail.",
        "type": "balance",
        "config": {"duration": 5000, "sensitivity": 2.8}
    },
    {
        "id": "misleading",
        "name": "Read",
        "instruction": "Tap the blue button. (Read the instruction carefully.)",
        "type": "misleading",
        "config": {"correct_action": "red"}
    },
    {
        "id": "wait_unknown",
        "name": "Wait",
        "instruction": "Tap only when the button appears. Tapping before it appears = fail.",
        "type": "wait",
        "config": {"min_wait": 3500, "max_wait": 7500}
    },
    {
        "id": "align_frame",
        "name": "Sync",
        "instruction": "Tap only when the two shapes overlap exactly. Slightly off = fail.",
        "type": "align",
        "config": {"speed": 3.2, "window_ms": 100, "align_threshold_deg": 9}
    },
    {
        "id": "timing_window",
        "name": "React",
        "instruction": "Tap as soon as it turns green. You have under 0.2 seconds.",
        "type": "reaction",
        "config": {"min_delay": 2200, "max_delay": 4800, "window_ms": 165}
    },
    {
        "id": "hesitation",
        "name": "Quick",
        "instruction": "Tap within 0.35 seconds of start. Hesitate = fail.",
        "type": "hesitation",
        "config": {"max_delay": 350}
    },
    {
        "id": "precision_slider",
        "name": "Exact",
        "instruction": "Slide to exactly 73. Lock in. Tolerance is ±0.4.",
        "type": "precision",
        "config": {"target": 73, "tolerance": 0.4}
    },
    {
        "id": "rapid_tap",
        "name": "Speed",
        "instruction": "Tap 12 times in 2 seconds. Not 11. Not 13.",
        "type": "rapid",
        "config": {"required_taps": 12, "time_limit": 2000, "tolerance": 0}
    },
    {
        "id": "color_stop",
        "name": "Color Stop",
        "instruction": "A color slowly shifts. Tap when it looks fully stopped. It never truly does.",
        "type": "color_stop",
        "config": {"cycle_ms": 5000, "window_ms": 70}
    },
    {
        "id": "vibration_end",
        "name": "Vibration",
        "instruction": "The phone vibrates inconsistently. Let go exactly when it stops. It fakes you out.",
        "type": "vibration_end",
        "config": {"duration_ms": 6000, "window_ms": 400}
    },
    {
        "id": "tap_center",
        "name": "Center",
        "instruction": "A dot appears. Tap the true mathematical center. No guides. Tiny tolerance.",
        "type": "tap_center",
        "config": {"tolerance_px": 10}
    },
    {
        "id": "dont_blink",
        "name": "Don't Blink",
        "instruction": "A button grows subtly. Touching too early or too late fails.",
        "type": "dont_blink",
        "config": {"grow_ms": 4500, "window_ms": 120}
    },
    {
        "id": "swipe_straight",
        "name": "Swipe Up",
        "instruction": "Swipe perfectly vertical. Very tight angle tolerance.",
        "type": "swipe_straight",
        "config": {"max_angle_deg": 10, "min_distance": 100}
    },
    {
        "id": "tap_once",
        "name": "One Tap",
        "instruction": "You are allowed exactly one tap. Nothing tells you when to tap.",
        "type": "tap_once",
        "config": {"min_wait": 4000, "max_wait": 9000, "window_ms": 350}
    },
    {
        "id": "follow_literal",
        "name": "Literal",
        "instruction": "Follow the instruction literally. Doing what it sounds like fails.",
        "type": "follow_literal",
        "config": {}
    },
    {
        "id": "tap_nothing",
        "name": "Nothing",
        "instruction": "Tap when nothing happens. The correct moment looks identical to all others.",
        "type": "tap_nothing",
        "config": {"trigger_after_ms": 5200, "window_ms": 280}
    },
    {
        "id": "timer_zero",
        "name": "Stop at Zero",
        "instruction": "Timer jumps from 0.02 to -0.01 unpredictably. Stop it at zero.",
        "type": "timer_zero",
        "config": {"window_ms": 180}
    },
    {
        "id": "finger_still",
        "name": "Finger Still",
        "instruction": "Keep your finger still. Microscopic movement is detected. Any jitter fails.",
        "type": "finger_still",
        "config": {"duration": 3500, "max_move_px": 5}
    },
    {
        "id": "drag_no_edge",
        "name": "No Edge",
        "instruction": "Drag the dot to the goal. Invisible margins exist. Hit one = instant fail.",
        "type": "drag_no_edge",
        "config": {"margin_px": 18}
    },
    {
        "id": "match_rhythm",
        "name": "Rhythm",
        "instruction": "A silent rhythm plays visually once. Reproduce it perfectly.",
        "type": "match_rhythm",
        "config": {"pattern_ms": [400, 400, 800, 400], "tolerance_ms": 120}
    },
    {
        "id": "wait_longer",
        "name": "Wait Longer",
        "instruction": "Wait longer than feels right. Touching too soon fails. Touching too late also fails.",
        "type": "wait_longer",
        "config": {"correct_after_ms": 5500, "window_ms": 400}
    },
    {
        "id": "odd_frame",
        "name": "Odd Frame",
        "instruction": "Out of many identical frames, one is slightly different for 1 frame. Tap it.",
        "type": "odd_frame",
        "config": {"total_frames": 80, "odd_duration_frames": 3}
    },
    {
        "id": "dont_react",
        "name": "Don't React",
        "instruction": "A fake GO! appears. Reacting instantly fails.",
        "type": "dont_react",
        "config": {"fake_go_at_ms": 2500, "real_go_at_ms": 5500, "window_ms": 200}
    },
    {
        "id": "swipe_slow",
        "name": "Slow Swipe",
        "instruction": "Swipe at the slowest speed. Too fast or too slow both fail.",
        "type": "swipe_slow",
        "config": {"min_speed": 35, "max_speed": 75, "min_distance": 150}
    },
    {
        "id": "tap_same_spot",
        "name": "Same Spot",
        "instruction": "The second tap must land exactly on the first pixel.",
        "type": "tap_same_spot",
        "config": {"tolerance_px": 8}
    },
    {
        "id": "zero_score",
        "name": "Zero Score",
        "instruction": "Every tap increases score. You must end with exactly zero.",
        "type": "zero_score",
        "config": {}
    }
]

# Models
class TaskStats(BaseModel):
    task_id: str
    attempts: int = 0
    completions: int = 0
    completion_rate: float = 0.0

class AttemptCreate(BaseModel):
    session_id: Optional[str] = None

class CompletionCreate(BaseModel):
    session_id: Optional[str] = None
    time_taken: Optional[int] = None

class ProfileCreate(BaseModel):
    session_id: str
    username: str
    display_name: str
    bio: Optional[str] = ""

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class TaskCreate(BaseModel):
    session_id: str
    name: str
    instruction: str
    type: str
    config: Optional[dict] = {}

class TaskSubmissionCreate(BaseModel):
    session_id: str
    name: str
    instruction: str
    type: str
    config: Optional[dict] = {}
    notes: Optional[str] = ""

class TaskResponse(BaseModel):
    id: str
    name: str
    instruction: str
    type: str
    config: dict
    stats: TaskStats
    created_by_username: Optional[str] = None

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    instruction: Optional[str] = None
    config: Optional[dict] = None

def _get_stats(task_id: str) -> dict:
    """Get stats for a task from Supabase, or default if not configured."""
    if not supabase:
        return {"task_id": task_id, "attempts": 0, "completions": 0, "completion_rate": 0.0}
    try:
        r = supabase.table("task_stats").select("task_id,attempts,completions,completion_rate").eq("task_id", task_id).execute()
        if r.data and len(r.data) > 0:
            row = r.data[0]
            return {"task_id": row["task_id"], "attempts": row["attempts"] or 0, "completions": row["completions"] or 0, "completion_rate": float(row["completion_rate"] or 0)}
    except Exception:
        pass
    return {"task_id": task_id, "attempts": 0, "completions": 0, "completion_rate": 0.0}


def _get_all_stats() -> list:
    """Get all task stats from Supabase."""
    if not supabase:
        return []
    try:
        r = supabase.table("task_stats").select("task_id,attempts,completions,completion_rate").execute()
        return r.data or []
    except Exception:
        return []


USER_TASK_TYPES = {
    "timing": {"target": 3000, "tolerance": 15},
    "reaction": {"min_delay": 2200, "max_delay": 4800, "window_ms": 165},
    "hesitation": {"max_delay": 350},
    "precision": {"target": 73, "tolerance": 0.4},
    "rapid": {"required_taps": 12, "time_limit": 2000, "tolerance": 0},
    "misleading": {"correct_action": "red"},
    "follow_literal": {"correct_label": "Blue", "wrong_label": "Red"},
    "wait": {"min_wait": 3500, "max_wait": 7500},
}

def _get_user_tasks() -> list:
    if not supabase:
        return []
    try:
        r = supabase.table("user_tasks").select("*").execute()
        return r.data or []
    except Exception:
        return []

def _resolve_task(task_id: str) -> Optional[dict]:
    builtin = next((t for t in TASKS if t["id"] == task_id), None)
    if builtin:
        return builtin
    if not supabase:
        return None
    try:
        r = supabase.table("user_tasks").select("*").eq("id", task_id).execute()
        if r.data and len(r.data) > 0:
            row = r.data[0]
            return {
                "id": row["id"], "name": row["name"], "instruction": row["instruction"],
                "type": row["type"], "config": row.get("config") or {},
                "created_by_username": row.get("created_by_username") or "",
            }
    except Exception:
        pass
    return None

# Routes
@api_router.get("/")
def root():
    return {"message": "Impossible Tasks API"}

@api_router.get("/health")
def health():
    """Check if Supabase is connected and working."""
    ok = supabase is not None
    detail = "connected" if ok else "not configured (SUPABASE_URL and SUPABASE_SERVICE_KEY required)"
    if ok:
        try:
            r = supabase.table("task_stats").select("task_id").limit(1).execute()
            detail = f"connected, task_stats ok ({len(r.data or [])} rows)"
        except Exception as e:
            detail = f"connected but error: {e}"
    return {"supabase": ok, "detail": detail}

@api_router.get("/tasks", response_model=List[TaskResponse])
def get_tasks():
    """Get global tasks. Prefer user-created tasks (with creator) when present; else built-in."""
    tasks_with_stats = []
    all_stats = {s["task_id"]: s for s in _get_all_stats()}
    user_tasks = [{"id": t["id"], "name": t["name"], "instruction": t["instruction"], "type": t["type"], "config": t.get("config") or {}, "created_by_username": t.get("created_by_username") or ""} for t in _get_user_tasks()]
    all_tasks = user_tasks if user_tasks else TASKS  # User tasks (with creator) or built-in; always ~30
    for task in all_tasks:
        stats = all_stats.get(task["id"]) or {"task_id": task["id"], "attempts": 0, "completions": 0, "completion_rate": 0.0}
        if "completion_rate" not in stats:
            stats["completion_rate"] = 0.0
        tasks_with_stats.append({**task, "stats": TaskStats(**stats)})
    return tasks_with_stats


@api_router.post("/tasks", response_model=TaskResponse)
def create_task(data: TaskCreate):
    """Create a user task. Requires a profile (tasks are tied to your profile)."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    prof = None
    try:
        r = supabase.table("profiles").select("id,username").eq("session_id", data.session_id).execute()
        if r.data and len(r.data) > 0:
            prof = r.data[0]
    except Exception:
        pass
    if not prof:
        raise HTTPException(status_code=403, detail="Create a profile first to create tasks")
    task_type = (data.type or "").strip().lower()
    if task_type not in USER_TASK_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid type. Choose from: {', '.join(USER_TASK_TYPES.keys())}")
    name = (data.name or "").strip()[:80]
    instruction = (data.instruction or "").strip()[:500]
    if not name or not instruction:
        raise HTTPException(status_code=400, detail="Name and instruction required")
    base_config = USER_TASK_TYPES[task_type].copy()
    if data.config:
        base_config.update({k: v for k, v in data.config.items() if v is not None and v != ""})
    task_id = f"user_{uuid.uuid4().hex[:12]}"
    created_by_username = prof.get("username")
    try:
        supabase.table("user_tasks").insert({
            "id": task_id,
            "created_by_session_id": data.session_id,
            "created_by_username": created_by_username,
            "name": name,
            "instruction": instruction,
            "type": task_type,
            "config": base_config,
        }).execute()
    except Exception as e:
        logging.exception(f"create_task: {e}")
        raise HTTPException(status_code=500, detail="Failed to create task")
    task = {"id": task_id, "name": name, "instruction": instruction, "type": task_type, "config": base_config, "created_by_username": created_by_username}
    stats = _get_stats(task_id)
    return {**task, "stats": TaskStats(**stats)}


@api_router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, data: TaskUpdate, session_id: str = ""):
    """Edit a user task. Only creator can edit."""
    if not supabase or not session_id:
        raise HTTPException(status_code=403, detail="Session required")
    task = _resolve_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.get("created_by_username"):
        raise HTTPException(status_code=403, detail="Built-in tasks cannot be edited")
    r = supabase.table("user_tasks").select("created_by_session_id").eq("id", task_id).execute()
    if not r.data or r.data[0].get("created_by_session_id") != session_id:
        raise HTTPException(status_code=403, detail="Only the creator can edit this task")
    updates = {}
    if data.name is not None and str(data.name).strip():
        updates["name"] = str(data.name).strip()[:80]
    if data.instruction is not None and str(data.instruction).strip():
        updates["instruction"] = str(data.instruction).strip()[:500]
    if data.config is not None:
        updates["config"] = data.config
    if not updates:
        raise HTTPException(status_code=400, detail="No changes provided")
    supabase.table("user_tasks").update(updates).eq("id", task_id).execute()
    task = _resolve_task(task_id)
    stats = _get_stats(task_id)
    return {**task, "stats": TaskStats(**stats)}


@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: str):
    """Get a single task with stats"""
    task = _resolve_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    stats = _get_stats(task_id)
    return {**task, "stats": TaskStats(**stats)}

@api_router.post("/tasks/{task_id}/attempt")
def record_attempt(task_id: str, data: AttemptCreate):
    """Record a task attempt"""
    task = _resolve_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not supabase:
        return {"status": "recorded", "task_id": task_id}
    try:
        supabase.rpc("increment_attempt", {"p_task_id": task_id}).execute()
        supabase.table("attempts").insert({
            "task_id": task_id,
            "session_id": data.session_id,
            "completed": False
        }).execute()
    except Exception as e:
        logging.warning(f"record_attempt: {e}")
    return {"status": "recorded", "task_id": task_id}

@api_router.post("/tasks/{task_id}/complete")
def record_completion(task_id: str, data: CompletionCreate):
    """Record a task completion"""
    task = _resolve_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not supabase:
        return {"status": "completed", "task_id": task_id, "stats": {"task_id": task_id, "attempts": 0, "completions": 0, "completion_rate": 0.0}}
    try:
        supabase.rpc("increment_completion", {"p_task_id": task_id}).execute()
        supabase.table("completions").insert({
            "task_id": task_id,
            "session_id": data.session_id,
            "time_taken": data.time_taken
        }).execute()
        stats = _get_stats(task_id)
            # Increment games_played for profile with this session_id
        if data.session_id:
            try:
                r = supabase.table("profiles").select("id,games_played").eq("session_id", data.session_id).execute()
                if r.data and len(r.data) > 0:
                    prof = r.data[0]
                    supabase.table("profiles").update({
                        "games_played": (prof.get("games_played") or 0) + 1,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }).eq("id", prof["id"]).execute()
            except Exception:
                pass
        return {"status": "completed", "task_id": task_id, "stats": stats}
    except Exception as e:
        print(f"[record_completion ERROR] {e}")
        logging.exception("record_completion failed")
        return {"status": "completed", "task_id": task_id, "stats": _get_stats(task_id)}

@api_router.get("/tasks/{task_id}/stats", response_model=TaskStats)
def get_task_stats(task_id: str):
    """Get stats for a specific task"""
    return TaskStats(**_get_stats(task_id))


@api_router.get("/user-tasks", response_model=List[TaskResponse])
def get_user_tasks(session_id: str = "", username: str = ""):
    """Get tasks created by a user. Use session_id for own tasks, username for any profile."""
    all_user_tasks = _get_user_tasks()
    if username:
        user_tasks = [t for t in all_user_tasks if (t.get("created_by_username") or "").lower() == username.strip().lower()]
    elif session_id:
        user_tasks = [t for t in all_user_tasks if t.get("created_by_session_id") == session_id]
    else:
        return []
    all_stats = {s["task_id"]: s for s in _get_all_stats()}
    result = []
    for t in user_tasks:
        stats = all_stats.get(t["id"]) or {"task_id": t["id"], "attempts": 0, "completions": 0, "completion_rate": 0.0}
        result.append({
            "id": t["id"],
            "name": t["name"],
            "instruction": t["instruction"],
            "type": t["type"],
            "config": t.get("config") or {},
            "created_by_username": t.get("created_by_username") or "",
            "stats": TaskStats(**stats),
        })
    return result


@api_router.get("/tasks/{task_id}/likes")
def get_task_likes(task_id: str, session_id: str = ""):
    """Get like count and whether current user liked."""
    if not supabase:
        return {"count": 0, "liked": False}
    try:
        r = supabase.table("task_likes").select("session_id").eq("task_id", task_id).execute()
        count = len(r.data or [])
        liked = bool(session_id and any((row.get("session_id") == session_id for row in (r.data or []))))
        return {"count": count, "liked": liked}
    except Exception:
        return {"count": 0, "liked": False}

def _update_profile_likes_received(task_id: str, delta: int):
    """Update the task creator's likes_received count."""
    if not supabase or delta == 0:
        return
    try:
        r = supabase.table("user_tasks").select("created_by_username").eq("id", task_id).execute()
        if not r.data or not r.data[0].get("created_by_username"):
            return
        username = r.data[0]["created_by_username"]
        prof = supabase.table("profiles").select("id,likes_received").eq("username", username).execute()
        if not prof.data or len(prof.data) == 0:
            return
        row = prof.data[0]
        new_count = max(0, (row.get("likes_received") or 0) + delta)
        supabase.table("profiles").update({
            "likes_received": new_count,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", row["id"]).execute()
    except Exception as e:
        logging.warning(f"_update_profile_likes_received: {e}")


@api_router.post("/tasks/{task_id}/like")
def like_task(task_id: str, session_id: str = ""):
    """Like a task."""
    if not supabase or not session_id:
        return {"count": 0, "liked": False}
    task = _resolve_task(task_id)
    if not task:
        return {"count": 0, "liked": False}
    try:
        r_existing = supabase.table("task_likes").select("session_id").eq("task_id", task_id).eq("session_id", session_id).execute()
        already_liked = bool(r_existing.data and len(r_existing.data) > 0)
        if not already_liked:
            supabase.table("task_likes").insert({"task_id": task_id, "session_id": session_id}).execute()
            _update_profile_likes_received(task_id, 1)
        r = supabase.table("task_likes").select("session_id").eq("task_id", task_id).execute()
        count = len(r.data or [])
        return {"count": count, "liked": True}
    except Exception as e:
        logging.warning(f"like_task: {e}")
        return {"count": 0, "liked": False}

@api_router.delete("/tasks/{task_id}/like")
def unlike_task(task_id: str, session_id: str = ""):
    """Unlike a task."""
    if not supabase or not session_id:
        return {"count": 0, "liked": False}
    try:
        r_before = supabase.table("task_likes").select("session_id").eq("task_id", task_id).eq("session_id", session_id).execute()
        was_liked = bool(r_before.data and len(r_before.data) > 0)
        supabase.table("task_likes").delete().eq("task_id", task_id).eq("session_id", session_id).execute()
        if was_liked:
            _update_profile_likes_received(task_id, -1)
        r = supabase.table("task_likes").select("session_id").eq("task_id", task_id).execute()
        count = len(r.data or [])
        return {"count": count, "liked": False}
    except Exception:
        return {"count": 0, "liked": False}

@api_router.get("/tasks/{task_id}/comments")
def get_task_comments(task_id: str):
    """Get comments for a task."""
    if not supabase:
        return []
    try:
        r = supabase.table("task_comments").select("*").eq("task_id", task_id).order("created_at").execute()
        return [{"id": str(c["id"]), "text": c["text"], "created_by_username": c.get("created_by_username") or "", "created_at": c.get("created_at")} for c in (r.data or [])]
    except Exception:
        return []

class CommentCreate(BaseModel):
    session_id: str
    text: str

@api_router.post("/tasks/{task_id}/comments")
def add_task_comment(task_id: str, data: CommentCreate):
    """Add a comment. Requires profile for username display."""
    if not supabase or not data.session_id:
        raise HTTPException(status_code=400, detail="Session required")
    if not _resolve_task(task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    prof = supabase.table("profiles").select("username").eq("session_id", data.session_id).execute()
    username = (prof.data[0].get("username") if prof.data else None) or ""
    text = (data.text or "").strip()[:500]
    if not text:
        raise HTTPException(status_code=400, detail="Comment text required")
    ins = supabase.table("task_comments").insert({"task_id": task_id, "session_id": data.session_id, "created_by_username": username, "text": text}).execute()
    row = ins.data[0] if ins.data else {}
    return {"id": str(row.get("id")), "text": text, "created_by_username": username}

@api_router.delete("/tasks/{task_id}")
def delete_task(task_id: str, session_id: str = ""):
    """Delete a user-created task. Only the creator can delete."""
    if not task_id.startswith("user_"):
        raise HTTPException(status_code=400, detail="Can only delete user-created tasks")
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        r = supabase.table("user_tasks").select("created_by_session_id").eq("id", task_id).execute()
        if not r.data or len(r.data) == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        if r.data[0]["created_by_session_id"] != session_id:
            raise HTTPException(status_code=403, detail="Not your task")
        supabase.table("user_tasks").delete().eq("id", task_id).execute()
        return {"status": "deleted", "task_id": task_id}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"delete_task: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete task")


# Task submissions (community plugin-style: submit new task types for review)
@api_router.post("/task-submissions")
def submit_task_type(data: TaskSubmissionCreate):
    """Submit a new task type for community review. Requires profile."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    prof = None
    try:
        r = supabase.table("profiles").select("username").eq("session_id", data.session_id).execute()
        if r.data and len(r.data) > 0:
            prof = r.data[0]
    except Exception:
        pass
    if not prof:
        raise HTTPException(status_code=403, detail="Create a profile first to submit task types")
    task_type = (data.type or "").strip().lower()
    if task_type not in USER_TASK_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid type. Choose from: {', '.join(USER_TASK_TYPES.keys())}")
    name = (data.name or "").strip()[:80]
    instruction = (data.instruction or "").strip()[:500]
    if not name or not instruction:
        raise HTTPException(status_code=400, detail="Name and instruction required")
    try:
        ins = supabase.table("task_submissions").insert({
            "created_by_session_id": data.session_id,
            "created_by_username": prof.get("username"),
            "name": name,
            "instruction": instruction,
            "type": task_type,
            "config": data.config or {},
            "status": "pending",
        }).execute()
        row = ins.data[0] if ins.data else {}
        return {"id": str(row.get("id")), "status": "pending", "message": "Submission received for review"}
    except Exception as e:
        logging.exception(f"submit_task_type: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit")


@api_router.get("/task-submissions")
def get_my_submissions(session_id: str = ""):
    """Get task submissions by the current user."""
    if not supabase or not session_id:
        return []
    try:
        r = supabase.table("task_submissions").select("*").eq("created_by_session_id", session_id).order("created_at", desc=True).execute()
        return r.data or []
    except Exception:
        return []


@api_router.get("/task-submissions/pending")
def get_pending_submissions(session_id: str = ""):
    """Admin: list pending submissions. Requires session_id in ADMIN_SESSION_IDS."""
    if not supabase or not session_id or session_id not in admin_session_ids:
        return []
    try:
        r = supabase.table("task_submissions").select("*").eq("status", "pending").order("created_at", desc=True).execute()
        return r.data or []
    except Exception:
        return []


@api_router.patch("/task-submissions/{submission_id}")
def review_task_submission(submission_id: str, action: str = "approve", session_id: str = ""):
    """Admin: approve or reject a task submission. Requires session_id in ADMIN_SESSION_IDS."""
    if not supabase or not session_id or session_id not in admin_session_ids:
        raise HTTPException(status_code=403, detail="Admin access required")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be approve or reject")
    try:
        r = supabase.table("task_submissions").select("*").eq("id", submission_id).single().execute()
        if not r.data:
            raise HTTPException(status_code=404, detail="Submission not found")
        row = r.data
        if row.get("status") != "pending":
            raise HTTPException(status_code=400, detail=f"Submission already {row.get('status')}")
        reviewer_prof = supabase.table("profiles").select("username").eq("session_id", session_id).execute()
        reviewer_username = (reviewer_prof.data[0].get("username") if reviewer_prof.data else None) or "admin"
        if action == "reject":
            supabase.table("task_submissions").update({
                "status": "reviewed_rejected",
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "reviewed_by": reviewer_username,
            }).eq("id", submission_id).execute()
            return {"status": "reviewed_rejected", "message": "Submission rejected"}
        # Approve: create task in user_tasks
        task_type = (row.get("type") or "").strip().lower()
        if task_type not in USER_TASK_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid task type {task_type}")
        base_config = USER_TASK_TYPES[task_type].copy()
        cfg = row.get("config") or {}
        base_config.update({k: v for k, v in cfg.items() if v is not None and v != ""})
        task_id = f"user_{uuid.uuid4().hex[:12]}"
        created_by_username = row.get("created_by_username") or ""
        supabase.table("user_tasks").insert({
            "id": task_id,
            "created_by_session_id": row.get("created_by_session_id"),
            "created_by_username": created_by_username,
            "name": (row.get("name") or "")[:80],
            "instruction": (row.get("instruction") or "")[:500],
            "type": task_type,
            "config": base_config,
        }).execute()
        supabase.table("task_submissions").update({
            "status": "approved",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": reviewer_username,
            "approved_task_id": task_id,
        }).eq("id", submission_id).execute()
        return {"status": "approved", "task_id": task_id, "message": "Submission approved and task created"}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"review_task_submission: {e}")
        raise HTTPException(status_code=500, detail="Failed to review submission")


@api_router.get("/leaderboard")
def get_leaderboard():
    """Get tasks sorted by difficulty (lowest completion rate)"""
    all_stats = _get_all_stats()
    stats_map = {s["task_id"]: s for s in all_stats}
    leaderboard = []
    for task in TASKS:
        stats = stats_map.get(task["id"])
        if stats:
            leaderboard.append({
                "task_id": task["id"],
                "name": task["name"],
                "completion_rate": float(stats.get("completion_rate") or 0),
                "attempts": stats.get("attempts") or 0
            })
        else:
            leaderboard.append({"task_id": task["id"], "name": task["name"], "completion_rate": 0, "attempts": 0})
    leaderboard.sort(key=lambda x: x["completion_rate"])
    return leaderboard


# Profile routes
def _get_tasks_created_count(username: str) -> int:
    """Count tasks created by this username."""
    if not supabase or not username:
        return 0
    try:
        r = supabase.table("user_tasks").select("id", count="exact").eq("created_by_username", username).execute()
        return r.count or 0
    except Exception:
        return 0


def _get_likes_received_count(username: str) -> int:
    """Count total likes on all tasks created by this username (from task_likes table)."""
    if not supabase or not username:
        return 0
    try:
        tasks = supabase.table("user_tasks").select("id").eq("created_by_username", username).execute()
        if not tasks.data or len(tasks.data) == 0:
            return 0
        task_ids = [t["id"] for t in tasks.data]
        r = supabase.table("task_likes").select("task_id").in_("task_id", task_ids).execute()
        return len(r.data or [])
    except Exception:
        return 0


def _profile_row_to_dict(row: dict, include_tasks_created: bool = False) -> dict:
    username = row.get("username") or ""
    likes_received = _get_likes_received_count(username)  # Always compute from task_likes
    out = {
        "id": str(row["id"]),
        "username": row["username"],
        "display_name": row["display_name"],
        "bio": row.get("bio") or "",
        "avatar_url": row.get("avatar_url"),
        "followers_count": row.get("followers_count") or 0,
        "following_count": row.get("following_count") or 0,
        "games_played": row.get("games_played") or 0,
        "likes_received": likes_received,
        "created_at": row.get("created_at"),
    }
    if include_tasks_created:
        out["tasks_created"] = _get_tasks_created_count(username)
    return out


@api_router.post("/profiles")
def create_profile(data: ProfileCreate):
    """Create a new profile (onboarding). Username must be unique."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    username_clean = data.username.strip().lower().replace(" ", "_")[:30]
    if not username_clean or len(data.display_name.strip()) < 1:
        raise HTTPException(status_code=400, detail="Username and display name required")
    try:
        # Check username taken
        existing = supabase.table("profiles").select("id").eq("username", username_clean).execute()
        if existing.data and len(existing.data) > 0:
            raise HTTPException(status_code=400, detail="Username already taken")
        # Check session already has profile
        existing_sess = supabase.table("profiles").select("id").eq("session_id", data.session_id).execute()
        if existing_sess.data and len(existing_sess.data) > 0:
            prof = supabase.table("profiles").select("*").eq("session_id", data.session_id).execute()
            return _profile_row_to_dict(prof.data[0], include_tasks_created=True)
        ins = supabase.table("profiles").insert({
            "session_id": data.session_id,
            "username": username_clean,
            "display_name": data.display_name.strip()[:50],
            "bio": (data.bio or "").strip()[:200],
        }).execute()
        if ins.data and len(ins.data) > 0:
            return _profile_row_to_dict(ins.data[0], include_tasks_created=True)
    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"create_profile: {e}")
        err_msg = str(e).strip() or "Failed to create profile"
        if "does not exist" in err_msg.lower() or "relation" in err_msg.lower():
            err_msg = "Profiles table missing. Run supabase_profiles.sql in Supabase SQL Editor."
        raise HTTPException(status_code=500, detail=err_msg)
    raise HTTPException(status_code=500, detail="Failed to create profile")


@api_router.get("/profiles/me")
def get_my_profile(session_id: str = ""):
    """Get current user's profile by session_id."""
    if not supabase or not session_id:
        return None
    try:
        r = supabase.table("profiles").select("*").eq("session_id", session_id).execute()
        if r.data and len(r.data) > 0:
            return _profile_row_to_dict(r.data[0], include_tasks_created=True)
    except Exception:
        pass
    return None


@api_router.get("/profiles/username/{username}")
def get_profile_by_username(username: str, session_id: str = ""):
    """Get profile by username. Optionally include is_following if session_id provided."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    username_clean = username.strip().lower().replace(" ", "_")
    try:
        r = supabase.table("profiles").select("*").eq("username", username_clean).execute()
        if not r.data or len(r.data) == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        prof = _profile_row_to_dict(r.data[0], include_tasks_created=True)
        if session_id:
            # Get my profile id
            my = supabase.table("profiles").select("id").eq("session_id", session_id).execute()
            if my.data and len(my.data) > 0:
                fid = my.data[0]["id"]
                fol = supabase.table("follows").select("follower_id").eq("follower_id", fid).eq("following_id", prof["id"]).execute()
                prof["is_following"] = bool(fol.data and len(fol.data) > 0)
            else:
                prof["is_following"] = False
        else:
            prof["is_following"] = False
        return prof
    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"get_profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")


@api_router.patch("/profiles/me")
def update_my_profile(data: ProfileUpdate, session_id: str = ""):
    """Update current user's profile."""
    if not supabase or not session_id:
        raise HTTPException(status_code=401, detail="Session required")
    try:
        upd = {}
        if data.display_name is not None:
            upd["display_name"] = data.display_name.strip()[:50]
        if data.bio is not None:
            upd["bio"] = data.bio.strip()[:200]
        if data.avatar_url is not None:
            upd["avatar_url"] = data.avatar_url
        if not upd:
            r = supabase.table("profiles").select("*").eq("session_id", session_id).execute()
            if r.data and len(r.data) > 0:
                return _profile_row_to_dict(r.data[0])
            raise HTTPException(status_code=404, detail="Profile not found")
        upd["updated_at"] = datetime.now(timezone.utc).isoformat()
        r = supabase.table("profiles").update(upd).eq("session_id", session_id).execute()
        if r.data and len(r.data) > 0:
            return _profile_row_to_dict(r.data[0])
        raise HTTPException(status_code=404, detail="Profile not found")
    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"update_profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")


@api_router.post("/profiles/{username}/follow")
def follow_profile(username: str, session_id: str = ""):
    """Follow a user. Requires session_id to identify follower."""
    if not supabase or not session_id:
        raise HTTPException(status_code=401, detail="Session required")
    username_clean = username.strip().lower().replace(" ", "_")
    try:
        my = supabase.table("profiles").select("id").eq("session_id", session_id).execute()
        if not my.data or len(my.data) == 0:
            raise HTTPException(status_code=404, detail="Create a profile first")
        target = supabase.table("profiles").select("id").eq("username", username_clean).execute()
        if not target.data or len(target.data) == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        result = supabase.rpc("follow_user", {"p_follower_id": my.data[0]["id"], "p_following_id": target.data[0]["id"]}).execute()
        if result.data:
            return _profile_row_to_dict(result.data) if isinstance(result.data, dict) else {"status": "following"}
        return {"status": "following"}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"follow: {e}")
        raise HTTPException(status_code=500, detail="Failed to follow")


@api_router.delete("/profiles/{username}/follow")
def unfollow_profile(username: str, session_id: str = ""):
    """Unfollow a user."""
    if not supabase or not session_id:
        raise HTTPException(status_code=401, detail="Session required")
    username_clean = username.strip().lower().replace(" ", "_")
    try:
        my = supabase.table("profiles").select("id").eq("session_id", session_id).execute()
        if not my.data or len(my.data) == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        target = supabase.table("profiles").select("id").eq("username", username_clean).execute()
        if not target.data or len(target.data) == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        supabase.rpc("unfollow_user", {"p_follower_id": my.data[0]["id"], "p_following_id": target.data[0]["id"]}).execute()
        r = supabase.table("profiles").select("*").eq("id", target.data[0]["id"]).execute()
        if r.data and len(r.data) > 0:
            return _profile_row_to_dict(r.data[0])
        return {"status": "unfollowed"}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"unfollow: {e}")
        raise HTTPException(status_code=500, detail="Failed to unfollow")


# Include router
app.include_router(api_router)

# CORS: with allow_credentials=True, browser rejects "*". Always allow Vercel + localhost.
_default_origins = [
    "https://tiktoktaskss.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
]
_cors_origins_env = os.environ.get("CORS_ORIGINS", "").strip()
_env_origins = [o.strip() for o in _cors_origins_env.split(",") if o.strip()]
cors_origins = list(dict.fromkeys((_env_origins or _default_origins) + _default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
