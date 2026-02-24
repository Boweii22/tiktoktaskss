-- Run in Supabase SQL Editor to add streak columns to profiles (optional; backend works with or without them)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0;
