/*
  # Fix Admin Access and Policies and Add Phone Number

  1. Changes
    - Drop and recreate admin functions with CASCADE
    - Add policy for admin to view all profiles
    - Add phone_number column to profiles table

  2. Security
    - Only users with admin role can access the view data
    - Access is controlled through functions with SECURITY DEFINER
*/

-- Drop existing functions and policies with CASCADE
DROP FUNCTION IF EXISTS get_admin_bookings() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Create function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  );
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

-- Recreate all necessary policies that depend on is_admin()
CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin can update profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can manage bookings"
ON bookings
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Only admins can manage categories"
ON fortune_categories
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can update fortune tellers"
ON fortune_tellers
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (is_admin() AND NOT has_active_bookings(id));

CREATE POLICY "Admin can delete fortune tellers"
ON fortune_tellers
FOR DELETE
TO authenticated
USING (is_admin() AND NOT has_fortune_teller_active_bookings(id));

CREATE POLICY "Admins can manage announcements"
ON announcements
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Add phone_number column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;