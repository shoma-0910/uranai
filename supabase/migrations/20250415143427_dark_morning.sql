/*
  # Add approved column to fortune_tellers table

  1. Changes
    - Add `approved` column to fortune_tellers table if it doesn't exist
    - Set default value to false
    - Update existing rows to have approved = false

  2. Security
    - No changes to existing policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'fortune_tellers' 
    AND column_name = 'approved'
  ) THEN
    ALTER TABLE fortune_tellers 
    ADD COLUMN approved boolean NOT NULL DEFAULT false;
  END IF;
END $$;