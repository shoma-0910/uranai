/*
  # Remove specified fortune categories

  1. Changes
    - Remove all specified categories from fortune_categories table
    - Keep the table structure intact
    - Maintain referential integrity

  2. Security
    - No changes to existing policies
*/

-- Delete all specified categories and their subcategories
DELETE FROM fortune_categories
WHERE name IN (
  '恋愛全般', '片思い', '復縁・復活愛', '不倫・浮気', '婚活・結婚', '友人・知人', 'ママ友・ご近所',
  '家族・家庭', '夫婦', '両親・嫁姑', '親戚', '妊活・妊娠', '子供・子育て',
  '仕事全般', '転職・退職', '人間関係', '適職・天職', '起業・独立', '収入・お金',
  'メンタルヘルス', 'ストレス', '生き方', '自己実現', '健康', 'スピリチュアル'
);

-- Delete parent categories if they have no remaining subcategories
DELETE FROM fortune_categories
WHERE name IN (
  '恋愛・結婚・人間関係の悩み',
  '家族・家庭・子育ての悩み',
  '仕事・キャリアの悩み',
  '心と身体の悩み'
)
AND NOT EXISTS (
  SELECT 1 FROM fortune_categories fc
  WHERE fc.parent_id = fortune_categories.id
);