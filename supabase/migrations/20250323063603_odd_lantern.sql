/*
  # Fix Admin Functions and Policies

  1. Changes
    - Drop existing policies and functions
    - Create more efficient admin check function
    - Add proper error handling for admin access
    - Fix infinite recursion issue

  2. Security
    - Functions use SECURITY DEFINER for proper access control
    - Clear separation between admin and non-admin access
*/

-- Drop existing policies and functions in the correct order
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP FUNCTION IF EXISTS get_admin_bookings();
DROP FUNCTION IF EXISTS is_admin();

-- Create a more efficient admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin bookings function with proper error handling
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
  -- Check admin status first
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
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
    u.email as user_email,
    COALESCE(u.full_name, '未設定') as user_name,
    ft.name as fortune_teller_name,
    ft.title as fortune_teller_title
  FROM bookings b
  JOIN profiles u ON b.user_id = u.id
  JOIN fortune_tellers ft ON b.fortune_teller_id = ft.id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new admin policy
CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());