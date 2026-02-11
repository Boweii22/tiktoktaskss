-- Run this in Supabase SQL Editor (after supabase_schema.sql and supabase_profiles.sql)
-- User-created tasks

CREATE TABLE IF NOT EXISTS user_tasks (
  id TEXT PRIMARY KEY,
  created_by_session_id TEXT NOT NULL,
  created_by_username TEXT,
  name TEXT NOT NULL,
  instruction TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_session ON user_tasks(created_by_session_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_type ON user_tasks(type);
