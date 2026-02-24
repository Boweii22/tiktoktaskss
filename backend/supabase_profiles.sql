-- Run this in Supabase SQL Editor (after supabase_schema.sql)
-- Adds profiles and follows for TikTok-style profiles

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  followers_count BIGINT NOT NULL DEFAULT 0,
  following_count BIGINT NOT NULL DEFAULT 0,
  games_played BIGINT NOT NULL DEFAULT 0,
  likes_received BIGINT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_session ON profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- RPC: follow a user (only update counts if actually inserted)
CREATE OR REPLACE FUNCTION follow_user(p_follower_id UUID, p_following_id UUID)
RETURNS JSONB AS $$
BEGIN
  IF p_follower_id = p_following_id THEN
    RETURN (SELECT to_jsonb(p.*) FROM profiles p WHERE id = p_following_id);
  END IF;
  INSERT INTO follows (follower_id, following_id) VALUES (p_follower_id, p_following_id)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN
    UPDATE profiles SET followers_count = followers_count + 1, updated_at = NOW() WHERE id = p_following_id;
    UPDATE profiles SET following_count = following_count + 1, updated_at = NOW() WHERE id = p_follower_id;
  END IF;
  RETURN (SELECT to_jsonb(p.*) FROM profiles p WHERE id = p_following_id);
END;
$$ LANGUAGE plpgsql;

-- RPC: unfollow (only update counts if row was deleted)
CREATE OR REPLACE FUNCTION unfollow_user(p_follower_id UUID, p_following_id UUID)
RETURNS JSONB AS $$
BEGIN
  DELETE FROM follows WHERE follower_id = p_follower_id AND following_id = p_following_id;
  IF FOUND THEN
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1), updated_at = NOW() WHERE id = p_following_id;
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1), updated_at = NOW() WHERE id = p_follower_id;
  END IF;
  RETURN (SELECT to_jsonb(p.*) FROM profiles p WHERE id = p_following_id);
END;
$$ LANGUAGE plpgsql;
