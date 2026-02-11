-- Run in Supabase SQL Editor (after supabase_user_tasks.sql)
-- Task likes and comments

CREATE TABLE IF NOT EXISTS task_likes (
  task_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, session_id)
);

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_by_username TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_likes_task ON task_likes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
