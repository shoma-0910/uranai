/*
  # Add availability schedule management

  1. New Tables
    - `availability_schedules`
      - `id` (uuid, primary key)
      - `fortune_teller_id` (uuid, references fortune_tellers)
      - `day_of_week` (integer) - 0 (Sunday) to 6 (Saturday)
      - `start_time` (time)
      - `end_time` (time)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for fortune tellers to manage their schedules
    - Add policy for public to view schedules
*/

CREATE TABLE availability_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fortune_teller_id uuid REFERENCES fortune_tellers(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Enable RLS
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;

-- Allow fortune tellers to manage their own schedules
CREATE POLICY "Fortune tellers can manage their schedules"
ON availability_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE id = availability_schedules.fortune_teller_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE id = availability_schedules.fortune_teller_id
    AND user_id = auth.uid()
  )
);

-- Allow public to view schedules
CREATE POLICY "Schedules are viewable by everyone"
ON availability_schedules
FOR SELECT
TO public
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_availability_fortune_teller_id ON availability_schedules(fortune_teller_id);
CREATE INDEX idx_availability_day_of_week ON availability_schedules(day_of_week);