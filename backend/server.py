from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (defaults for local dev)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'impossible_tasks')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    client.close()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Task definitions - these define the impossible tasks
TASKS = [
    {
        "id": "hold3000",
        "name": "Hold",
        "instruction": "Hold for exactly 3 seconds.",
        "type": "timing",
        "config": {"target": 3000, "tolerance": 20}
    },
    {
        "id": "static_tap",
        "name": "Still",
        "instruction": "Tap when the circle stops moving.",
        "type": "static_tap",
        "config": {"cycle_ms": 4000, "window_ms": 50}
    },
    {
        "id": "shrinking_circle",
        "name": "Catch",
        "instruction": "Drag the dot into the circle.",
        "type": "shrinking_circle",
        "config": {"shrink_rate": 0.95, "min_size": 10}
    },
    {
        "id": "trap_tap",
        "name": "Tap 50",
        "instruction": "Tap exactly 50 times.",
        "type": "trap_tap",
        "config": {"required_taps": 50, "trap_position": -1}
    },
    {
        "id": "balance_shape",
        "name": "Balance",
        "instruction": "Keep it balanced for 5 seconds.",
        "type": "balance",
        "config": {"duration": 5000, "sensitivity": 2}
    },
    {
        "id": "misleading",
        "name": "Read",
        "instruction": "Tap the blue button.",
        "type": "misleading",
        "config": {"correct_action": "red"}
    },
    {
        "id": "wait_unknown",
        "name": "Wait",
        "instruction": "Wait.",
        "type": "wait",
        "config": {"min_wait": 3000, "max_wait": 8000}
    },
    {
        "id": "align_frame",
        "name": "Sync",
        "instruction": "Tap when they align.",
        "type": "align",
        "config": {"speed": 3, "window_ms": 100}
    },
    {
        "id": "timing_window",
        "name": "React",
        "instruction": "Tap when it turns green.",
        "type": "reaction",
        "config": {"min_delay": 2000, "max_delay": 5000, "window_ms": 200}
    },
    {
        "id": "hesitation",
        "name": "Quick",
        "instruction": "Tap immediately.",
        "type": "hesitation",
        "config": {"max_delay": 500}
    },
    {
        "id": "precision_slider",
        "name": "Exact",
        "instruction": "Slide to 73.",
        "type": "precision",
        "config": {"target": 73, "tolerance": 0.5}
    },
    {
        "id": "rapid_tap",
        "name": "Speed",
        "instruction": "Tap 10 times in 2 seconds. Exactly.",
        "type": "rapid",
        "config": {"required_taps": 10, "time_limit": 2000, "tolerance": 0}
    },
    {
        "id": "hold_5",
        "name": "Steady",
        "instruction": "Hold for exactly 5 seconds. No more, no less.",
        "type": "timing",
        "config": {"target": 5000, "tolerance": 50}
    },
    {
        "id": "slide_42",
        "name": "Forty-Two",
        "instruction": "Slide to exactly 42.",
        "type": "precision",
        "config": {"target": 42, "tolerance": 1}
    },
    {
        "id": "double_tap",
        "name": "Double",
        "instruction": "Double-tap. Not too fast, not too slow.",
        "type": "double_tap",
        "config": {"min_gap": 200, "max_gap": 600}
    },
    {
        "id": "dont_tap",
        "name": "Resist",
        "instruction": "Don't tap for 4 seconds. (Yes, it will try to trick you.)",
        "type": "dont_tap",
        "config": {"duration": 4000}
    },
    {
        "id": "color_react",
        "name": "Yellow",
        "instruction": "Tap only when it turns yellow.",
        "type": "color_react",
        "config": {"min_delay": 1500, "max_delay": 4500, "window_ms": 250}
    },
    {
        "id": "count_7",
        "name": "Count",
        "instruction": "Tap at exactly 7 seconds. No timer — count in your head.",
        "type": "count_seconds",
        "config": {"target_seconds": 7, "tolerance_ms": 800}
    },
    {
        "id": "odd_one_out",
        "name": "Different",
        "instruction": "Tap the one that's different.",
        "type": "odd_one_out",
        "config": {"count": 4}
    },
    {
        "id": "sequence_tap",
        "name": "Order",
        "instruction": "Tap in order: 1, then 2, then 3, then 4.",
        "type": "sequence_tap",
        "config": {"length": 4}
    },
    {
        "id": "double_react",
        "name": "Both",
        "instruction": "Tap when both circles turn green.",
        "type": "double_react",
        "config": {"min_delay": 2500, "max_delay": 5500, "window_ms": 220}
    },
    {
        "id": "hold_7",
        "name": "Patience",
        "instruction": "Hold for exactly 7 seconds.",
        "type": "timing",
        "config": {"target": 7000, "tolerance": 80}
    },
    {
        "id": "rapid_5",
        "name": "Five",
        "instruction": "Tap 5 times in 1 second. Exactly.",
        "type": "rapid",
        "config": {"required_taps": 5, "time_limit": 1000, "tolerance": 0}
    },
    {
        "id": "wait_5",
        "name": "Chill",
        "instruction": "Wait. Tap only when the button appears.",
        "type": "wait",
        "config": {"min_wait": 4000, "max_wait": 7000}
    },
    {
        "id": "precision_0",
        "name": "Zero",
        "instruction": "Slide to exactly 0. Don't overshoot.",
        "type": "precision",
        "config": {"target": 0, "tolerance": 0.5}
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

# Routes
@api_router.get("/")
async def root():
    return {"message": "Impossible Tasks API"}

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks():
    """Get all tasks with their stats"""
    tasks_with_stats = []
    for task in TASKS:
        stats = await db.task_stats.find_one({"task_id": task["id"]}, {"_id": 0})
        if not stats:
            stats = {"task_id": task["id"], "attempts": 0, "completions": 0, "completion_rate": 0.0}
        tasks_with_stats.append({
            **task,
            "stats": TaskStats(**stats)
        })
    return tasks_with_stats

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get a single task with stats"""
    task = next((t for t in TASKS if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    stats = await db.task_stats.find_one({"task_id": task_id}, {"_id": 0})
    if not stats:
        stats = {"task_id": task_id, "attempts": 0, "completions": 0, "completion_rate": 0.0}
    
    return {**task, "stats": TaskStats(**stats)}

@api_router.post("/tasks/{task_id}/attempt")
async def record_attempt(task_id: str, data: AttemptCreate):
    """Record a task attempt"""
    task = next((t for t in TASKS if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update stats
    result = await db.task_stats.find_one_and_update(
        {"task_id": task_id},
        {"$inc": {"attempts": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0}
    )
    
    # Recalculate completion rate
    if result:
        attempts = result.get("attempts", 1)
        completions = result.get("completions", 0)
        rate = (completions / attempts * 100) if attempts > 0 else 0
        await db.task_stats.update_one(
            {"task_id": task_id},
            {"$set": {"completion_rate": round(rate, 2)}}
        )
    
    # Log individual attempt
    await db.attempts.insert_one({
        "id": str(uuid.uuid4()),
        "task_id": task_id,
        "session_id": data.session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "completed": False
    })
    
    return {"status": "recorded", "task_id": task_id}

@api_router.post("/tasks/{task_id}/complete")
async def record_completion(task_id: str, data: CompletionCreate):
    """Record a task completion"""
    task = next((t for t in TASKS if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update stats (completion also counts as one attempt)
    result = await db.task_stats.find_one_and_update(
        {"task_id": task_id},
        {"$inc": {"attempts": 1, "completions": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0}
    )
    
    # Recalculate completion rate
    if result:
        attempts = result.get("attempts", 1)
        completions = result.get("completions", 1)
        rate = (completions / attempts * 100) if attempts > 0 else 100
        await db.task_stats.update_one(
            {"task_id": task_id},
            {"$set": {"completion_rate": round(rate, 2)}}
        )
    
    # Log completion
    await db.completions.insert_one({
        "id": str(uuid.uuid4()),
        "task_id": task_id,
        "session_id": data.session_id,
        "time_taken": data.time_taken,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Get updated stats
    updated_stats = await db.task_stats.find_one({"task_id": task_id}, {"_id": 0})
    
    return {
        "status": "completed",
        "task_id": task_id,
        "stats": updated_stats
    }

@api_router.get("/tasks/{task_id}/stats", response_model=TaskStats)
async def get_task_stats(task_id: str):
    """Get stats for a specific task"""
    stats = await db.task_stats.find_one({"task_id": task_id}, {"_id": 0})
    if not stats:
        return TaskStats(task_id=task_id)
    return TaskStats(**stats)

@api_router.get("/leaderboard")
async def get_leaderboard():
    """Get tasks sorted by difficulty (lowest completion rate)"""
    all_stats = await db.task_stats.find({}, {"_id": 0}).to_list(100)
    
    # Merge with task info
    leaderboard = []
    for task in TASKS:
        stats = next((s for s in all_stats if s["task_id"] == task["id"]), None)
        if stats:
            leaderboard.append({
                "task_id": task["id"],
                "name": task["name"],
                "completion_rate": stats.get("completion_rate", 0),
                "attempts": stats.get("attempts", 0)
            })
        else:
            leaderboard.append({
                "task_id": task["id"],
                "name": task["name"],
                "completion_rate": 0,
                "attempts": 0
            })
    
    # Sort by completion rate (hardest first)
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
