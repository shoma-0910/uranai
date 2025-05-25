/*
  # Create storage policies for profile photos

  1. Changes
    - Create storage bucket for profile photos
    - Add policies to allow authenticated users to manage their photos
    - Enable public access to view photos

  Note: Storage buckets and policies must be created manually in the Supabase dashboard
*/

-- Create storage bucket (this needs to be done manually in the Supabase dashboard)
-- Name: profile-photos
-- Public bucket: Yes
-- File size limit: 5MB
-- Allowed MIME Types: image/*

-- Storage Policies to add manually in the Supabase dashboard:

-- Policy 1: Allow authenticated users to upload their own photos
-- Name: Allow authenticated uploads
-- Definition: auth.uid() = (storage.foldername)::uuid
-- Operation: INSERT
-- Role: authenticated

-- Policy 2: Allow authenticated users to update their own photos
-- Name: Allow authenticated updates
-- Definition: auth.uid() = (storage.foldername)::uuid
-- Operation: UPDATE
-- Role: authenticated

-- Policy 3: Allow authenticated users to delete their own photos
-- Name: Allow authenticated deletes
-- Definition: auth.uid() = (storage.foldername)::uuid
-- Operation: DELETE
-- Role: authenticated

-- Policy 4: Allow public access to view photos
-- Name: Allow public select
-- Definition: true
-- Operation: SELECT
-- Role: public