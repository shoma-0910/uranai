/*
  # Add protection for users with active bookings

  1. Changes
    - Create function to check if a user has active bookings
    - Create function to check if a fortune teller has active bookings
    - Update admin delete policies to prevent deletion of users with active bookings
    - Update admin delete policies to prevent deletion of fortune tellers with active bookings

  2. Security
    - Only admins can delete users and fortune tellers
    - Cannot delete users or fortune tellers with active bookings
*/

-- Create function to check if a user has active bookings
CREATE OR REPLACE FUNCTION has_active_bookings(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE user_id = $1
    AND status IN ('pending', 'confirmed')
    AND start_time > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a fortune teller has active bookings
CREATE OR REPLACE FUNCTION has_fortune_teller_active_bookings(fortune_teller_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE fortune_teller_id = $1
    AND status IN ('pending', 'confirmed')
    AND start_time > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing admin delete policies
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete fortune tellers" ON fortune_tellers;

-- Create new admin delete policies with booking checks
CREATE POLICY "Admin can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (
  is_admin() AND
  NOT has_active_bookings(id)
);

CREATE POLICY "Admin can delete fortune tellers"
ON fortune_tellers
FOR DELETE
TO authenticated
USING (
  is_admin() AND
  NOT has_fortune_teller_active_bookings(id)
);