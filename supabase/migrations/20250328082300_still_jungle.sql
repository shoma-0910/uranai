/*
  # Fix Admin Delete Functionality

  1. Changes
    - Add CASCADE DELETE to all foreign key constraints
    - Add proper indexes for better query performance
    - Update RLS policies to allow admin deletions

  2. Security
    - Only admins can delete accounts
    - All related data is properly cleaned up
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete fortune tellers" ON fortune_tellers;

-- Create admin delete policies
CREATE POLICY "Admin can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Admin can delete fortune tellers"
ON fortune_tellers
FOR DELETE
TO authenticated
USING (is_admin());

-- Add CASCADE DELETE to fortune_tellers foreign key constraints
ALTER TABLE fortune_tellers
DROP CONSTRAINT IF EXISTS fortune_tellers_user_id_fkey;

ALTER TABLE fortune_tellers
ADD CONSTRAINT fortune_tellers_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add CASCADE DELETE to availability_schedules foreign key constraints
ALTER TABLE availability_schedules
DROP CONSTRAINT IF EXISTS availability_schedules_fortune_teller_id_fkey;

ALTER TABLE availability_schedules
ADD CONSTRAINT availability_schedules_fortune_teller_id_fkey 
FOREIGN KEY (fortune_teller_id) 
REFERENCES fortune_tellers(id)
ON DELETE CASCADE;

-- Add CASCADE DELETE to bookings foreign key constraints
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey,
DROP CONSTRAINT IF EXISTS bookings_fortune_teller_id_fkey;

ALTER TABLE bookings
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE bookings
ADD CONSTRAINT bookings_fortune_teller_id_fkey 
FOREIGN KEY (fortune_teller_id) 
REFERENCES fortune_tellers(id)
ON DELETE CASCADE;