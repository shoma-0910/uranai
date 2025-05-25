/*
  # Update fortune tellers table and policies

  1. Changes
    - Drop existing policies if they exist
    - Add approved column if it doesn't exist
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Update policies to handle approved status
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Fortune tellers are viewable by everyone" ON fortune_tellers;
DROP POLICY IF EXISTS "Users can update their own fortune teller profile" ON fortune_tellers;
DROP POLICY IF EXISTS "Users can delete their own fortune teller profile" ON fortune_tellers;
DROP POLICY IF EXISTS "Authenticated users can create fortune teller profiles" ON fortune_tellers;

-- Add approved column if it doesn't exist
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

-- Enable RLS if not already enabled
ALTER TABLE fortune_tellers ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Fortune tellers are viewable by everyone" 
ON fortune_tellers FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Users can update their own fortune teller profile" 
ON fortune_tellers FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fortune teller profile" 
ON fortune_tellers FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create fortune teller profiles" 
ON fortune_tellers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);