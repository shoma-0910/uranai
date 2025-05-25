/*
  # Fix Bookings RLS Policy

  1. Changes
    - Update the INSERT policy for bookings table to properly allow authenticated users to create bookings
    - Keep existing policies for SELECT and UPDATE
    - Ensure proper security while allowing booking creation

  2. Security
    - Users can only create bookings for themselves
    - Users can only view their own bookings or bookings made for their fortune telling service
    - Users can only update their own bookings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;

-- Recreate policies with proper permissions
CREATE POLICY "Users can create bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE fortune_tellers.id = fortune_teller_id
    AND fortune_tellers.available = true
  )
);

CREATE POLICY "Users can view their own bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE fortune_tellers.id = bookings.fortune_teller_id
    AND fortune_tellers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);