-- Run in Supabase SQL Editor: creates task_bookmarks table

CREATE TABLE IF NOT EXISTS task_bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  task_id     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_session ON task_bookmarks(session_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_task    ON task_bookmarks(task_id);
