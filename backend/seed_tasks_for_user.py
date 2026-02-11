"""
Seed script: Add all 30 built-in tasks to a specific username (e.g. boweii_gmx).
Run from backend folder: python seed_tasks_for_user.py
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from supabase import create_client

# Import TASKS from server
from server import TASKS

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = (os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY", "")).strip()

TARGET_USERNAME = "boweii_gmx"  # Change to "bowei_gmx" if that's your username (without @)

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get session_id for this username
    r = client.table("profiles").select("session_id").eq("username", TARGET_USERNAME).execute()
    if not r.data or len(r.data) == 0:
        print(f"Error: No profile found for username '{TARGET_USERNAME}'")
        print("Make sure you have created a profile with that username first.")
        sys.exit(1)

    session_id = r.data[0]["session_id"]
    print(f"Found profile for @{TARGET_USERNAME}, session_id: {session_id[:20]}...")

    # Check existing user tasks for this username to avoid duplicates
    existing = client.table("user_tasks").select("id").eq("created_by_username", TARGET_USERNAME).execute()
    existing_ids = {row["id"] for row in (existing.data or [])}

    # Insert tasks 1–30 (all built-in tasks)
    tasks_to_add = TASKS[:30]
    inserted = 0
    skipped = 0

    for task in tasks_to_add:
        user_task_id = f"user_{task['id']}"
        if user_task_id in existing_ids:
            skipped += 1
            continue

        try:
            client.table("user_tasks").insert({
                "id": user_task_id,
                "created_by_session_id": session_id,
                "created_by_username": TARGET_USERNAME,
                "name": task["name"],
                "instruction": task["instruction"],
                "type": task["type"],
                "config": task.get("config") or {},
            }).execute()
            inserted += 1
            print(f"  Added: {task['name']} ({user_task_id})")
        except Exception as e:
            if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
                skipped += 1
            else:
                print(f"  Failed {task['name']}: {e}")

    print(f"\nDone. Inserted {inserted} tasks, skipped {skipped} (already exist).")
    print(f"Tasks are now tied to @{TARGET_USERNAME} only.")

if __name__ == "__main__":
    main()
