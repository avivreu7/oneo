-- ============================================================
-- Supabase Storage: Make game-media bucket public
-- Run this in the Supabase SQL Editor to fix media display
-- ============================================================

-- Create the bucket as public if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-media',
  'game-media',
  TRUE,
  10485760,  -- 10 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = TRUE,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'audio/mpeg', 'audio/wav', 'audio/ogg'
      ];

-- Allow everyone to read (SELECT) objects in the game-media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Public read game-media'
  ) THEN
    CREATE POLICY "Public read game-media"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'game-media');
  END IF;
END
$$;

-- Allow service role / authenticated users to INSERT (upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Admin upload game-media'
  ) THEN
    CREATE POLICY "Admin upload game-media"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'game-media');
  END IF;
END
$$;

-- Allow service role to DELETE objects (for future cleanup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Admin delete game-media'
  ) THEN
    CREATE POLICY "Admin delete game-media"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'game-media');
  END IF;
END
$$;
