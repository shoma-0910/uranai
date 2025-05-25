/*
  # Separate user and fortune teller data

  1. Changes
    - Create separate tables for users and fortune tellers
    - Add proper foreign key relationships
    - Migrate existing data to new structure
    - Update RLS policies

  2. Security
    - Drop existing policies first to avoid conflicts
    - Recreate policies with proper permissions
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Fortune tellers are viewable by everyone" ON fortune_tellers;
  DROP POLICY IF EXISTS "Users can update their own fortune teller profile" ON fortune_tellers;
  DROP POLICY IF EXISTS "Users can delete their own fortune teller profile" ON fortune_tellers;
  DROP POLICY IF EXISTS "Authenticated users can create fortune teller profiles" ON fortune_tellers;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fortune_tellers table
CREATE TABLE IF NOT EXISTS fortune_tellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  title text NOT NULL,
  bio text NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  price_per_minute integer NOT NULL DEFAULT 100,
  avatar_url text,
  specialties text[] NOT NULL DEFAULT '{}',
  available boolean NOT NULL DEFAULT true,
  approved boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fortune_tellers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_fortune_tellers_user_id ON fortune_tellers(user_id);
CREATE INDEX IF NOT EXISTS idx_fortune_tellers_rating ON fortune_tellers(rating);

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can create their profile"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Create policies for fortune_tellers table
CREATE POLICY "Fortune tellers are viewable by everyone"
ON fortune_tellers
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update their own fortune teller profile"
ON fortune_tellers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fortune teller profile"
ON fortune_tellers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create fortune teller profiles"
ON fortune_tellers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fortune_tellers_updated_at
  BEFORE UPDATE ON fortune_tellers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data
INSERT INTO users (id, email, full_name, created_at, updated_at)
SELECT id, email, full_name, created_at, updated_at
FROM profiles
ON CONFLICT (id) DO NOTHING;

-- Store existing bookings in a temporary table
CREATE TEMP TABLE temp_bookings AS 
SELECT * FROM bookings;

-- Drop existing foreign key constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

-- Drop existing bookings
DELETE FROM bookings;

-- Add new foreign key constraint
ALTER TABLE bookings
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id)
ON DELETE CASCADE;

-- Restore bookings that have valid user references
INSERT INTO bookings
SELECT b.* FROM temp_bookings b
JOIN users u ON b.user_id = u.id;

-- Drop temporary table
DROP TABLE temp_bookings;