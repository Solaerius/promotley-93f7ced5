-- Add SELECT policy for profile-images bucket (for viewing images)
CREATE POLICY "Anyone can view profile images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

-- Add INSERT policy for profile-images bucket
CREATE POLICY "Users can upload own profile images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);