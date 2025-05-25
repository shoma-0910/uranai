/*
  # Create storage bucket and policies for profile photos

  1. Changes
    - Create storage bucket for profile photos if it doesn't exist
    - Add policies for authenticated users to manage their photos
    - Enable public access to view photos
    - Set bucket configuration (file size limit, MIME types)
*/

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profile-photos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile-photos', 'profile-photos', true);
  END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
END $$;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view photos
CREATE POLICY "Allow public select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Update bucket configuration
UPDATE storage.buckets
SET public = true,
    file_size_limit = 5242880, -- 5MB in bytes
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'profile-photos';