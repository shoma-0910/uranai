/*
  # Fix RLS policies for profiles table

  1. Security
    - Drop existing policies to avoid conflicts
    - Enable RLS on profiles table
    - Add policy for authenticated users to read their own profile
    - Add policy for users to update their own profile
    - Add policy for new user registration to create profile
    - Add policy for admins to view all profiles
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can create their profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow new users to create their profile during registration
CREATE POLICY "Users can create their profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin' OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));