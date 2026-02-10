-- Analysis creators (folders per content creator to analyze)
CREATE TABLE IF NOT EXISTS public.analysis_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analysis_creators_user ON public.analysis_creators(user_id);
ALTER TABLE public.analysis_creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analysis_creators_all_own" ON public.analysis_creators FOR ALL USING (auth.uid() = user_id);

-- Create default creator for each user who has existing analysis entries
INSERT INTO public.analysis_creators (user_id, name)
SELECT DISTINCT user_id, 'Default' FROM public.analysis_entries;

-- Add creator_id to analysis_entries (nullable first for backfill)
ALTER TABLE public.analysis_entries ADD COLUMN IF NOT EXISTS creator_id UUID;

UPDATE public.analysis_entries e
SET creator_id = (SELECT c.id FROM public.analysis_creators c WHERE c.user_id = e.user_id AND c.name = 'Default' LIMIT 1)
WHERE e.creator_id IS NULL;

ALTER TABLE public.analysis_entries ALTER COLUMN creator_id SET NOT NULL;
ALTER TABLE public.analysis_entries ADD CONSTRAINT analysis_entries_creator_fk
  FOREIGN KEY (creator_id) REFERENCES public.analysis_creators(id) ON DELETE CASCADE;

-- Replace unique constraint: (user_id, entry_id) -> (user_id, creator_id, entry_id)
ALTER TABLE public.analysis_entries DROP CONSTRAINT IF EXISTS analysis_entries_user_id_entry_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_entries_user_creator_entry
  ON public.analysis_entries(user_id, creator_id, entry_id);

CREATE INDEX IF NOT EXISTS idx_analysis_entries_creator ON public.analysis_entries(creator_id);
