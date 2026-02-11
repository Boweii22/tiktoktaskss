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

class TaskResponse(BaseModel):
    id: str
    name: str
    instruction: str
    type: str
    config: dict
    stats: TaskStats

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
    """Get all tasks with their stats"""
    tasks_with_stats = []
    all_stats = {s["task_id"]: s for s in _get_all_stats()}
    for task in TASKS:
        stats = all_stats.get(task["id"]) or {"task_id": task["id"], "attempts": 0, "completions": 0, "completion_rate": 0.0}
        if "completion_rate" not in stats:
            stats["completion_rate"] = 0.0
        tasks_with_stats.append({**task, "stats": TaskStats(**stats)})
    return tasks_with_stats

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: str):
    """Get a single task with stats"""
    task = next((t for t in TASKS if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    stats = _get_stats(task_id)
    return {**task, "stats": TaskStats(**stats)}

@api_router.post("/tasks/{task_id}/attempt")
def record_attempt(task_id: str, data: AttemptCreate):
    """Record a task attempt"""
    task = next((t for t in TASKS if t["id"] == task_id), None)
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
    task = next((t for t in TASKS if t["id"] == task_id), None)
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
        return {"status": "completed", "task_id": task_id, "stats": stats}
    except Exception as e:
        print(f"[record_completion ERROR] {e}")
        logging.exception("record_completion failed")
        return {"status": "completed", "task_id": task_id, "stats": _get_stats(task_id)}

@api_router.get("/tasks/{task_id}/stats", response_model=TaskStats)
def get_task_stats(task_id: str):
    """Get stats for a specific task"""
    return TaskStats(**_get_stats(task_id))

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

# Include router
app.include_router(api_router)

# CORS: with allow_credentials=True, browser rejects "*". Default to common dev origins.
_default_origins = [
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
cors_origins = [o.strip() for o in _cors_origins_env.split(",") if o.strip()] if _cors_origins_env else _default_origins

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
