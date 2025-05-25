/*
  # Update policies for public admin access

  1. Changes
    - Allow public access to view profiles
    - Remove authentication requirement for viewing profiles
*/

-- Drop existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can create their profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
END $$;

-- Allow everyone to view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

-- Keep existing policies for user management
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can create their profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);