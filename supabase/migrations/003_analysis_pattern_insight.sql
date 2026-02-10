-- One row per user: free-form answer to "What common pattern did you find across 49 videos?"
CREATE TABLE IF NOT EXISTS public.analysis_pattern_insight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analysis_pattern_insight_user ON public.analysis_pattern_insight(user_id);
ALTER TABLE public.analysis_pattern_insight ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analysis_pattern_insight_all_own" ON public.analysis_pattern_insight
  FOR ALL USING (auth.uid() = user_id);
