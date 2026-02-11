-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates tables for Impossible Tasks backend

-- Task statistics (one row per task)
CREATE TABLE IF NOT EXISTS task_stats (
  task_id TEXT PRIMARY KEY,
  attempts BIGINT NOT NULL DEFAULT 0,
  completions BIGINT NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual attempt logs
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  session_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Completion logs
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  session_id TEXT,
  time_taken INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attempts_task_id ON attempts(task_id);
CREATE INDEX IF NOT EXISTS idx_completions_task_id ON completions(task_id);

-- RPC: atomic increment for attempt (attempts += 1)
CREATE OR REPLACE FUNCTION increment_attempt(p_task_id TEXT)
RETURNS JSONB AS $$
DECLARE
  r RECORD;
BEGIN
  INSERT INTO task_stats (task_id, attempts, completions, completion_rate)
  VALUES (p_task_id, 1, 0, 0)
  ON CONFLICT (task_id) DO UPDATE SET
    attempts = task_stats.attempts + 1,
    updated_at = NOW();
  SELECT * INTO r FROM task_stats WHERE task_id = p_task_id;
  UPDATE task_stats SET completion_rate = ROUND((r.completions::numeric / NULLIF(r.attempts, 0) * 100), 2)
  WHERE task_id = p_task_id;
  RETURN (SELECT to_jsonb(t.*) FROM task_stats t WHERE task_id = p_task_id);
END;
$$ LANGUAGE plpgsql;

-- RPC: atomic increment for completion (attempts += 1, completions += 1)
CREATE OR REPLACE FUNCTION increment_completion(p_task_id TEXT)
RETURNS JSONB AS $$
DECLARE
  r RECORD;
BEGIN
  INSERT INTO task_stats (task_id, attempts, completions, completion_rate)
  VALUES (p_task_id, 1, 1, 100)
  ON CONFLICT (task_id) DO UPDATE SET
    attempts = task_stats.attempts + 1,
    completions = task_stats.completions + 1,
    updated_at = NOW();
  SELECT * INTO r FROM task_stats WHERE task_id = p_task_id;
  UPDATE task_stats SET completion_rate = ROUND((r.completions::numeric / NULLIF(r.attempts, 0) * 100), 2)
  WHERE task_id = p_task_id;
  RETURN (SELECT to_jsonb(t.*) FROM task_stats t WHERE task_id = p_task_id);
END;
$$ LANGUAGE plpgsql;
