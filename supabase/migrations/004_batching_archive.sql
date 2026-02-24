-- Add archive support to batching: users can store scripts in archive and add them back to batching
ALTER TABLE public.batching_scripts
ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_batching_archived ON public.batching_scripts(user_id, archived);
