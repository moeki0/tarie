ALTER TABLE public.books ADD COLUMN IF NOT EXISTS desk_photos jsonb DEFAULT '[]'::jsonb;
