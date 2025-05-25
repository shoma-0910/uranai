/*
  # Add favorite fortune tellers feature if not exists

  1. Changes
    - Create favorite_fortune_tellers table if it doesn't exist
    - Add RLS policies if they don't exist
    - Add indexes for better performance

  2. Security
    - Enable RLS
    - Add policies for users to manage their favorites
*/

-- Create favorite_fortune_tellers table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'favorite_fortune_tellers'
  ) THEN
    CREATE TABLE favorite_fortune_tellers (
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      fortune_teller_id uuid REFERENCES fortune_tellers(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      PRIMARY KEY (user_id, fortune_teller_id)
    );

    -- Enable RLS
    ALTER TABLE favorite_fortune_tellers ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can manage their own favorites"
    ON favorite_fortune_tellers
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

    -- Create indexes for better performance
    CREATE INDEX idx_favorite_fortune_tellers_user_id 
    ON favorite_fortune_tellers(user_id);
    
    CREATE INDEX idx_favorite_fortune_tellers_fortune_teller_id 
    ON favorite_fortune_tellers(fortune_teller_id);
  END IF;
END $$;