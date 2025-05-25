/*
  # Fix Admin Access Control

  1. Changes
    - Drop and recreate admin functions with better error handling
    - Add proper admin role check
    - Update admin policies

  2. Security
    - Ensure proper admin role validation
    - Add better error handling for admin functions
*/

-- Drop existing policies and functions
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
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
DECLARE
  v_is_admin boolean;
BEGIN
  -- Get admin status
  SELECT is_admin() INTO v_is_admin;
  
  -- Check admin status with proper error message
  IF NOT v_is_admin THEN
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

  -- Return empty set if no results (instead of NULL)
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin policy with proper check
CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());