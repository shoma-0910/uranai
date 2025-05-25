/*
  # Fix Admin Access and Policies

  1. Changes
    - Create function to check if a user is an admin
    - Create function to get admin bookings view
    - Add policy for admin to view all profiles with fixed recursion issue

  2. Security
    - Only users with admin role can access the view data
    - Access is controlled through functions with SECURITY DEFINER
*/

-- Create function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  user_type_val text;
BEGIN
  SELECT user_type INTO user_type_val
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_type_val = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin bookings view
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
    u.full_name as user_name,
    ft.name as fortune_teller_name,
    ft.title as fortune_teller_title
  FROM bookings b
  JOIN profiles u ON b.user_id = u.id
  JOIN fortune_tellers ft ON b.fortune_teller_id = ft.id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Create new admin policy using is_admin() function to prevent recursion
CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());