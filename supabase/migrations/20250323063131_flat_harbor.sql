/*
  # Fix Admin Policy Recursion

  1. Changes
    - Drop existing admin policy
    - Create new admin policy using a direct check without recursion
    - Add function to safely check admin status

  2. Security
    - Maintains security by ensuring only admins can access data
    - Avoids infinite recursion in policy checks
*/

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Create a function to check admin status safely
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT user_type = 'admin'
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new admin policy without recursion
CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());