-- Universe app: Full Supabase migration (no backend)
-- Uses auth.users for authentication, RLS for data access control
-- Run in Supabase SQL Editor or via Supabase CLI

-- ==================== PROFILES (replaces users, linked to auth.users) ====================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    streak INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    current_planet INTEGER DEFAULT 0,
    last_post_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, picture)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== MISSIONS ====================
CREATE TABLE IF NOT EXISTS public.missions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_missions_user ON public.missions(user_id);

-- ==================== SOS COMPLETIONS ====================
CREATE TABLE IF NOT EXISTS public.sos_completions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    asteroids JSONB DEFAULT '[]',
    affirmations JSONB DEFAULT '[]',
    completed_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sos_user ON public.sos_completions(user_id);

-- ==================== CREATOR UNIVERSE ====================
CREATE TABLE IF NOT EXISTS public.creator_universe (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    overarching_goal TEXT DEFAULT '',
    content_pillars JSONB DEFAULT '[]',
    avatar JSONB,
    identity JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creator_universe_user ON public.creator_universe(user_id);

-- ==================== ANALYSIS ENTRIES ====================
CREATE TABLE IF NOT EXISTS public.analysis_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    UNIQUE(user_id, entry_id)
);
CREATE INDEX IF NOT EXISTS idx_analysis_user ON public.analysis_entries(user_id);

-- ==================== SCHEDULE ====================
CREATE TABLE IF NOT EXISTS public.schedule (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    schedule JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schedule_user ON public.schedule(user_id);

-- ==================== STORY FINDER ====================
CREATE TABLE IF NOT EXISTS public.story_finder (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    rows JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_story_finder_user ON public.story_finder(user_id);

-- ==================== CONTENT TIPS PROGRESS ====================
CREATE TABLE IF NOT EXISTS public.content_tips_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tip_id TEXT NOT NULL,
    quiz_completed BOOLEAN DEFAULT FALSE,
    quiz_score INTEGER,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, tip_id)
);
CREATE INDEX IF NOT EXISTS idx_content_tips_user ON public.content_tips_progress(user_id);

-- ==================== BATCHING SCRIPTS ====================
CREATE TABLE IF NOT EXISTS public.batching_scripts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    script_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    UNIQUE(user_id, script_id)
);
CREATE INDEX IF NOT EXISTS idx_batching_user ON public.batching_scripts(user_id);

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_universe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_finder ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tips_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batching_scripts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Missions
CREATE POLICY "missions_all_own" ON public.missions FOR ALL USING (auth.uid() = user_id);

-- SOS completions
CREATE POLICY "sos_all_own" ON public.sos_completions FOR ALL USING (auth.uid() = user_id);

-- Creator universe
CREATE POLICY "creator_universe_all_own" ON public.creator_universe FOR ALL USING (auth.uid() = user_id);

-- Analysis entries
CREATE POLICY "analysis_all_own" ON public.analysis_entries FOR ALL USING (auth.uid() = user_id);

-- Schedule
CREATE POLICY "schedule_all_own" ON public.schedule FOR ALL USING (auth.uid() = user_id);

-- Story finder
CREATE POLICY "story_finder_all_own" ON public.story_finder FOR ALL USING (auth.uid() = user_id);

-- Content tips progress
CREATE POLICY "content_tips_all_own" ON public.content_tips_progress FOR ALL USING (auth.uid() = user_id);

-- Batching scripts
CREATE POLICY "batching_all_own" ON public.batching_scripts FOR ALL USING (auth.uid() = user_id);
