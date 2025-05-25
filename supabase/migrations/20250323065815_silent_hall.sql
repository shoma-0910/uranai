/*
  # Fix Admin Access and Database Functions

  1. Changes
    - Drop existing policy that depends on is_admin()
    - Drop and recreate admin-related functions
    - Recreate policy with new is_admin() function

  2. Security
    - Only users with admin role can access admin functions
    - Access is controlled through security definer functions
*/

-- First, ensure we have an admin user
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_type = 'admin'
  ) THEN
    -- Insert admin profile if none exists
    INSERT INTO profiles (id, email, full_name, user_type)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      'System Administrator',
      'admin'
    );
  END IF;
END $$;

-- Drop the policy that depends on is_admin() first
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS list_admins();
DROP FUNCTION IF EXISTS get_admin_bookings();
DROP FUNCTION IF EXISTS is_admin();

-- Create a more secure admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  v_user_type text;
BEGIN
  SELECT user_type INTO v_user_type
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_user_type = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin bookings function with better error handling
CREATE OR REPLACE FUNCTION get_admin_bookings()
RETURNS TABLE (
  id uuid,
  start_time timestamptz,
  duration_minutes integer,
  total_price integer,
  status text,
  notes text,
  created_at timestamptz,
  user_email text,
  user_name text,
  fortune_teller_name text,
  fortune_teller_title text
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.start_time,
    b.duration_minutes,
    b.total_price,
    b.status,
    b.notes,
    b.created_at,
    p.email as user_email,
    COALESCE(p.full_name, '未設定') as user_name,
    ft.name as fortune_teller_name,
    ft.title as fortune_teller_title
  FROM bookings b
  JOIN profiles p ON b.user_id = p.id
  JOIN fortune_tellers ft ON b.fortune_teller_id = ft.id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to list admins
CREATE OR REPLACE FUNCTION list_admins()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  user_type text,
  created_at timestamptz
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view admin list';
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.user_type, p.created_at
  FROM profiles p
  WHERE p.user_type = 'admin'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the admin policy
CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());