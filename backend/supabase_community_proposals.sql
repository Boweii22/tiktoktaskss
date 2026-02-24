-- Run in Supabase SQL Editor (after supabase_profiles.sql)
-- Community proposals: idea + optional image, status pending/reviewing/implemented

CREATE TABLE IF NOT EXISTS community_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_session_id TEXT NOT NULL,
  created_by_username TEXT NOT NULL,
  title TEXT,
  idea_text TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'implemented')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_proposals_username ON community_proposals(created_by_username);
CREATE INDEX IF NOT EXISTS idx_community_proposals_status ON community_proposals(status);
CREATE INDEX IF NOT EXISTS idx_community_proposals_created ON community_proposals(created_at DESC);

-- If the table already exists and needs the reviewing status added:
-- ALTER TABLE community_proposals DROP CONSTRAINT IF EXISTS community_proposals_status_check;
-- ALTER TABLE community_proposals ADD CONSTRAINT community_proposals_status_check CHECK (status IN ('pending', 'reviewing', 'implemented'));
