/*
  # Fix Admin Access and Policies

  1. Changes
    - Create function to check if a user is an admin using auth.jwt()
    - Create function to get admin bookings view
    - Add policy for admin to view all profiles without recursion
    - Add trigger to set user role in auth.users metadata

  2. Security
    - Only users with admin role can access the view data
    - Access is controlled through JWT claims instead of recursive table queries
    - Role information stored in user metadata for JWT claims
*/

-- Create function to check if a user is an admin using JWT claims
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() ->> 'user_metadata')::jsonb ->> 'user_type' = 'admin';
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

-- Create function to sync user type to auth.users metadata
CREATE OR REPLACE FUNCTION sync_user_type_to_metadata()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{user_type}',
    to_jsonb(NEW.user_type)
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync user type
CREATE TRIGGER sync_user_type_on_profile_change
  AFTER INSERT OR UPDATE OF user_type
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_type_to_metadata();

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Create new admin policy using JWT-based admin check
CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());

-- Sync existing profiles' user types to auth.users metadata
DO $$
BEGIN
  UPDATE auth.users u
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{user_type}',
    to_jsonb(p.user_type)
  )
  FROM profiles p
  WHERE u.id = p.id;
END $$;