/*
  # Add favorite fortune tellers feature

  1. New Tables
    - `favorite_fortune_tellers`
      - `user_id` (uuid, references profiles)
      - `fortune_teller_id` (uuid, references fortune_tellers)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for users to manage their favorites
*/

-- Create favorite_fortune_tellers table
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
CREATE INDEX idx_favorite_fortune_tellers_user_id ON favorite_fortune_tellers(user_id);
CREATE INDEX idx_favorite_fortune_tellers_fortune_teller_id ON favorite_fortune_tellers(fortune_teller_id);