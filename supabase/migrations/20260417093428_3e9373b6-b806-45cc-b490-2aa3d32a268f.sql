-- 1. Storage bucket för post-media (privat)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  false,
  104857600, -- 100 MB
  ARRAY['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS policies på storage.objects för bucket 'post-media'
-- Filstruktur: {user_id}/{filename}
CREATE POLICY "Users upload own post-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users read own post-media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own post-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own post-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Utöka calendar_posts för auto-publicering
ALTER TABLE public.calendar_posts
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('video','image')),
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft','scheduled','published','failed')),
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_error text;

-- Index för cron-lookup av schemalagda inlägg
CREATE INDEX IF NOT EXISTS idx_calendar_posts_publish_lookup
  ON public.calendar_posts (publish_status, scheduled_at)
  WHERE publish_status = 'scheduled';