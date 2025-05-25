/*
  # Add protection for users with active bookings

  1. Changes
    - Drop policies first to resolve dependencies
    - Drop and recreate functions for checking active bookings
    - Create new admin delete policies

  2. Security
    - Only admins can delete users and fortune tellers
    - Cannot delete users or fortune tellers with active bookings
*/

-- First drop the policies that depend on the functions
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete fortune tellers" ON fortune_tellers;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS has_active_bookings(uuid);
DROP FUNCTION IF EXISTS has_fortune_teller_active_bookings(uuid);

-- Create function to check if a user has active bookings
CREATE OR REPLACE FUNCTION has_active_bookings(profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.user_id = $1
    AND bookings.status IN ('pending', 'confirmed')
    AND bookings.start_time > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a fortune teller has active bookings
CREATE OR REPLACE FUNCTION has_fortune_teller_active_bookings(fortune_teller_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.fortune_teller_id = $1
    AND bookings.status IN ('pending', 'confirmed')
    AND bookings.start_time > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_active_bookings(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION has_fortune_teller_active_bookings(uuid) TO authenticated, service_role;

-- Create new admin delete policies with booking checks
CREATE POLICY "Admin can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (
  is_admin() AND
  NOT has_active_bookings(profiles.id)
);

CREATE POLICY "Admin can delete fortune tellers"
ON fortune_tellers
FOR DELETE
TO authenticated
USING (
  is_admin() AND
  NOT has_fortune_teller_active_bookings(fortune_tellers.id)
);