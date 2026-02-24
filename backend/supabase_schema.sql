-- Universe app schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor after creating your project

-- Users
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    streak INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    current_planet INTEGER DEFAULT 0,
    last_post_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User sessions (for Emergent Auth session tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_token)
);

CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_missions_user ON missions(user_id);

-- SOS completions
CREATE TABLE IF NOT EXISTS sos_completions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    asteroids JSONB DEFAULT '[]',
    affirmations JSONB DEFAULT '[]',
    completed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sos_user ON sos_completions(user_id);

-- Creator universe
CREATE TABLE IF NOT EXISTS creator_universe (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    overarching_goal TEXT DEFAULT '',
    content_pillars JSONB DEFAULT '[]',
    avatar JSONB,
    identity JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_universe_user ON creator_universe(user_id);

-- Analysis entries (data as JSONB for flexible schema)
CREATE TABLE IF NOT EXISTS analysis_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    UNIQUE(user_id, entry_id)
);

CREATE INDEX idx_analysis_user ON analysis_entries(user_id);

-- Schedule
CREATE TABLE IF NOT EXISTS schedule (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    schedule JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_user ON schedule(user_id);

-- Story finder
CREATE TABLE IF NOT EXISTS story_finder (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    rows JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_story_finder_user ON story_finder(user_id);

-- Content tips progress
CREATE TABLE IF NOT EXISTS content_tips_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tip_id TEXT NOT NULL,
    quiz_completed BOOLEAN DEFAULT FALSE,
    quiz_score INTEGER,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, tip_id)
);

CREATE INDEX idx_content_tips_user ON content_tips_progress(user_id);

-- Batching scripts (data as JSONB for flexible schema)
CREATE TABLE IF NOT EXISTS batching_scripts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    script_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, script_id)
);

CREATE INDEX idx_batching_user ON batching_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_batching_archived ON batching_scripts(user_id, archived);

-- Enable RLS (Row Level Security) - use service role key in backend to bypass
-- For service role, RLS is bypassed by default
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_universe ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_finder ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tips_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE batching_scripts ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (service role bypasses RLS by default)
-- Allow all for now - backend uses service_role key which bypasses RLS
