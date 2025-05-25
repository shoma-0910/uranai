/*
  # Fix Admin Bookings Management

  1. Changes
    - Add admin policies for bookings table
    - Add admin function to manage bookings
    - Add proper indexes for better query performance

  2. Security
    - Only admins can manage all bookings
    - Proper RLS policies for admin access
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage bookings" ON bookings;

-- Create admin policies for bookings
CREATE POLICY "Admin can manage bookings"
ON bookings
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

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
  payment_deadline timestamptz,
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
    b.payment_deadline,
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

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_deadline ON bookings(payment_deadline);