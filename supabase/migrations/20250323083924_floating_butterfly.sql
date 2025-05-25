/*
  # Add payment information table and update bookings

  1. New Tables
    - `payment_info`
      - `id` (uuid, primary key)
      - `bank_name` (text)
      - `branch_name` (text)
      - `account_type` (text)
      - `account_number` (text)
      - `account_holder` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add payment_info_id to fortune_tellers table
    - Add payment_deadline to bookings table

  3. Security
    - Enable RLS on payment_info table
    - Add policies for fortune tellers to manage their payment info
    - Add policies for users to view payment info
*/

-- Create payment_info table
CREATE TABLE IF NOT EXISTS payment_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  branch_name text NOT NULL,
  account_type text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add payment_info_id to fortune_tellers
ALTER TABLE fortune_tellers
ADD COLUMN payment_info_id uuid REFERENCES payment_info(id);

-- Add payment_deadline to bookings
ALTER TABLE bookings
ADD COLUMN payment_deadline timestamptz;

-- Enable RLS
ALTER TABLE payment_info ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Fortune tellers can manage their payment info"
ON payment_info
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE fortune_tellers.payment_info_id = payment_info.id
    AND fortune_tellers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE fortune_tellers.payment_info_id = payment_info.id
    AND fortune_tellers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view payment info for their bookings"
ON payment_info
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    JOIN fortune_tellers ON bookings.fortune_teller_id = fortune_tellers.id
    WHERE fortune_tellers.payment_info_id = payment_info.id
    AND bookings.user_id = auth.uid()
  )
);

-- Create trigger to update payment_deadline
CREATE OR REPLACE FUNCTION set_payment_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set payment deadline to one day before the booking
  NEW.payment_deadline := NEW.start_time - interval '1 day';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_payment_deadline
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_deadline();