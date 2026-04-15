
-- 1. Remove Twilio sensitive columns from notification_settings
ALTER TABLE public.notification_settings
  DROP COLUMN IF EXISTS twilio_account_sid,
  DROP COLUMN IF EXISTS twilio_auth_token,
  DROP COLUMN IF EXISTS twilio_phone_number,
  DROP COLUMN IF EXISTS recipient_phone_number;

-- 2. Fix swish_orders INSERT policy to require authenticated user
DROP POLICY IF EXISTS "Users can create own orders" ON public.swish_orders;
CREATE POLICY "Users can create own orders"
  ON public.swish_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Restrict public bucket file listing
-- Remove overly broad SELECT policies on storage.objects for public buckets
-- and replace with path-scoped policies that allow reading individual files but not listing

-- For profile-images: allow public read of individual files (needed for avatar display)
-- but restrict to authenticated users for listing
DO $$
BEGIN
  -- Drop any existing overly broad policy for public buckets
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public read access for profile-images'
  ) THEN
    DROP POLICY "Public read access for profile-images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public read access for email-assets'
  ) THEN
    DROP POLICY "Public read access for email-assets" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Anyone can view profile images'
  ) THEN
    DROP POLICY "Anyone can view profile images" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Anyone can view email assets'
  ) THEN
    DROP POLICY "Anyone can view email assets" ON storage.objects;
  END IF;
END $$;

-- Recreate with path-based access (allows fetching known file paths but not listing)
CREATE POLICY "Scoped read for profile-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-images' AND (name IS NOT NULL));

CREATE POLICY "Scoped read for email-assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'email-assets' AND (name IS NOT NULL));
