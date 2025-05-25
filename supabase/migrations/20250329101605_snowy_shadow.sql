/*
  # Add fortune telling categories

  1. Changes
    - Add fortune_categories table for managing categories
    - Add fortune_teller_categories table for many-to-many relationships
    - Add RLS policies for proper access control

  2. Security
    - Enable RLS on new tables
    - Add policies for viewing and managing categories
*/

-- Create fortune_categories table
CREATE TABLE fortune_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES fortune_categories(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create fortune_teller_categories table for many-to-many relationships
CREATE TABLE fortune_teller_categories (
  fortune_teller_id uuid REFERENCES fortune_tellers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES fortune_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (fortune_teller_id, category_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE fortune_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fortune_teller_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for fortune_categories
CREATE POLICY "Categories are viewable by everyone"
ON fortune_categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Only admins can manage categories"
ON fortune_categories
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create policies for fortune_teller_categories
CREATE POLICY "Fortune teller categories are viewable by everyone"
ON fortune_teller_categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Fortune tellers can manage their own categories"
ON fortune_teller_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE fortune_tellers.id = fortune_teller_categories.fortune_teller_id
    AND fortune_tellers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fortune_tellers
    WHERE fortune_tellers.id = fortune_teller_categories.fortune_teller_id
    AND fortune_tellers.user_id = auth.uid()
  )
);

-- Insert initial categories
INSERT INTO fortune_categories (name) VALUES
('恋愛・結婚・人間関係の悩み'),
('家族・家庭・子育ての悩み'),
('仕事・キャリアの悩み'),
('心と身体の悩み');

-- Get the IDs of parent categories
DO $$
DECLARE
  love_id uuid;
  family_id uuid;
  work_id uuid;
  health_id uuid;
BEGIN
  SELECT id INTO love_id FROM fortune_categories WHERE name = '恋愛・結婚・人間関係の悩み' LIMIT 1;
  SELECT id INTO family_id FROM fortune_categories WHERE name = '家族・家庭・子育ての悩み' LIMIT 1;
  SELECT id INTO work_id FROM fortune_categories WHERE name = '仕事・キャリアの悩み' LIMIT 1;
  SELECT id INTO health_id FROM fortune_categories WHERE name = '心と身体の悩み' LIMIT 1;

  -- Insert subcategories
  -- Love & Relationships
  INSERT INTO fortune_categories (name, parent_id) VALUES
  ('恋愛全般', love_id),
  ('片思い', love_id),
  ('復縁・復活愛', love_id),
  ('不倫・浮気', love_id),
  ('婚活・結婚', love_id),
  ('友人・知人', love_id),
  ('ママ友・ご近所', love_id);

  -- Family & Parenting
  INSERT INTO fortune_categories (name, parent_id) VALUES
  ('家族・家庭', family_id),
  ('夫婦', family_id),
  ('両親・嫁姑', family_id),
  ('親戚', family_id),
  ('妊活・妊娠', family_id),
  ('子供・子育て', family_id);

  -- Work & Career
  INSERT INTO fortune_categories (name, parent_id) VALUES
  ('仕事全般', work_id),
  ('転職・退職', work_id),
  ('人間関係', work_id),
  ('適職・天職', work_id),
  ('起業・独立', work_id),
  ('収入・お金', work_id);

  -- Mental & Physical Health
  INSERT INTO fortune_categories (name, parent_id) VALUES
  ('メンタルヘルス', health_id),
  ('ストレス', health_id),
  ('生き方', health_id),
  ('自己実現', health_id),
  ('健康', health_id),
  ('スピリチュアル', health_id);
END $$;

-- Create indexes for better performance
CREATE INDEX idx_fortune_categories_parent_id ON fortune_categories(parent_id);
CREATE INDEX idx_fortune_teller_categories_fortune_teller_id ON fortune_teller_categories(fortune_teller_id);
CREATE INDEX idx_fortune_teller_categories_category_id ON fortune_teller_categories(category_id);