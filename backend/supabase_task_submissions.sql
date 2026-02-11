-- Run in Supabase SQL Editor (after supabase_user_tasks.sql)
-- Community plugin-style: users submit new task types for review

CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_session_id TEXT NOT NULL,
  created_by_username TEXT,
  name TEXT NOT NULL,
  instruction TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'reviewed_rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  approved_task_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_session ON task_submissions(created_by_session_id);
