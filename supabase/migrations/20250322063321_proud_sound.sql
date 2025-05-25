/*
  # Update availability schedules to use dates

  1. Changes
    - Add `date` column to `availability_schedules` table
    - Convert existing day_of_week entries to actual dates
    - Remove `day_of_week` column
    - Add index for better query performance
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies with updated conditions
*/

-- First, add the date column allowing NULL temporarily
ALTER TABLE availability_schedules ADD COLUMN date date;

-- Create a function to generate dates for the next 30 days
CREATE OR REPLACE FUNCTION generate_dates_from_day_of_week(day_num integer)
RETURNS date AS $$
DECLARE
  current_date date := CURRENT_DATE;
  days_to_add integer;
BEGIN
  days_to_add := (day_num - EXTRACT(DOW FROM current_date) + 7) % 7;
  RETURN current_date + days_to_add;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with corresponding dates
UPDATE availability_schedules
SET date = generate_dates_from_day_of_week(day_of_week);

-- Now make the date column NOT NULL
ALTER TABLE availability_schedules ALTER COLUMN date SET NOT NULL;

-- Drop the temporary function
DROP FUNCTION generate_dates_from_day_of_week(integer);

-- Remove the old day_of_week column
ALTER TABLE availability_schedules DROP COLUMN day_of_week;

-- Add index for date column
CREATE INDEX idx_availability_date ON availability_schedules(date);

-- Update RLS policies
DROP POLICY IF EXISTS "Fortune tellers can manage their schedules" ON availability_schedules;
DROP POLICY IF EXISTS "Schedules are viewable by everyone" ON availability_schedules;

CREATE POLICY "Fortune tellers can manage their schedules"
ON availability_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE fortune_tellers.id = availability_schedules.fortune_teller_id
    AND fortune_tellers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE fortune_tellers.id = availability_schedules.fortune_teller_id
    AND fortune_tellers.user_id = auth.uid()
  )
);

CREATE POLICY "Schedules are viewable by everyone"
ON availability_schedules
FOR SELECT
TO public
USING (true);