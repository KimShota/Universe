-- Effective formats: store formats from analysis and which content they work for
CREATE TABLE IF NOT EXISTS public.effective_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format_name TEXT NOT NULL,
  format_description TEXT DEFAULT '',
  effective_for TEXT NOT NULL DEFAULT '',
  source_entry_id TEXT,
  source_creator_id UUID,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_effective_formats_user ON public.effective_formats(user_id);
ALTER TABLE public.effective_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "effective_formats_all_own" ON public.effective_formats FOR ALL USING (auth.uid() = user_id);
