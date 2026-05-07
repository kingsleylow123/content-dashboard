-- Content Analytics Dashboard — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query → Paste → Run

CREATE TABLE content_analytics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform         TEXT NOT NULL,          -- 'instagram' | 'youtube'
  post_id          TEXT NOT NULL UNIQUE,
  title            TEXT,
  caption          TEXT,
  thumbnail_url    TEXT,
  permalink        TEXT,
  published_at     TIMESTAMPTZ NOT NULL,
  views            BIGINT DEFAULT 0,
  likes            BIGINT DEFAULT 0,
  comments         BIGINT DEFAULT 0,
  shares           BIGINT DEFAULT 0,
  saves            BIGINT DEFAULT 0,
  reach            BIGINT DEFAULT 0,
  impressions      BIGINT DEFAULT 0,
  engagement_rate  FLOAT DEFAULT 0,
  watch_time_mins  FLOAT DEFAULT 0,
  video_type       TEXT DEFAULT 'video',   -- 'video' | 'short' (YouTube only)
  synced_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_analytics_published_at ON content_analytics(published_at DESC);
CREATE INDEX idx_content_analytics_platform ON content_analytics(platform);

CREATE TABLE profile_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform    TEXT NOT NULL,
  followers   BIGINT DEFAULT 0,
  following   BIGINT,
  post_count  BIGINT,
  snapped_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_snapshots_platform ON profile_snapshots(platform);
CREATE INDEX idx_profile_snapshots_snapped_at ON profile_snapshots(snapped_at DESC);

-- Disable RLS (personal dashboard — no public access needed)
ALTER TABLE content_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_snapshots DISABLE ROW LEVEL SECURITY;
