/*
  # Fix Bookings Table Foreign Key Relationships

  1. Changes
    - Drop existing foreign key constraints if they exist
    - Add proper foreign key constraints for bookings table
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Drop existing foreign key constraints if they exist
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey,
DROP CONSTRAINT IF EXISTS bookings_fortune_teller_id_fkey;

-- Add foreign key constraints with proper references
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

-- Add indexes for better query performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'bookings' 
    AND indexname = 'idx_bookings_user_id'
  ) THEN
    CREATE INDEX idx_bookings_user_id ON bookings(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'bookings' 
    AND indexname = 'idx_bookings_fortune_teller_id'
  ) THEN
    CREATE INDEX idx_bookings_fortune_teller_id ON bookings(fortune_teller_id);
  END IF;
END $$;