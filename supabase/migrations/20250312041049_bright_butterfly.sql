/*
  # 占い師プロフィールテーブルの作成

  1. 新規テーブル
    - `fortune_tellers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - 占い師の名前
      - `title` (text) - 肩書き・専門分野
      - `bio` (text) - 自己紹介
      - `experience_years` (integer) - 経験年数
      - `price_per_minute` (integer) - 1分あたりの料金
      - `avatar_url` (text) - プロフィール画像URL
      - `specialties` (text[]) - 得意分野（配列）
      - `available` (boolean) - 予約受付可能かどうか
      - `rating` (numeric) - 評価平均
      - `review_count` (integer) - レビュー数
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. セキュリティ
    - RLSを有効化
    - 誰でも閲覧可能
    - 自身のプロフィールのみ編集可能
*/

CREATE TABLE fortune_tellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  title text NOT NULL,
  bio text NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  price_per_minute integer NOT NULL DEFAULT 100,
  avatar_url text,
  specialties text[] NOT NULL DEFAULT '{}',
  available boolean NOT NULL DEFAULT true,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

ALTER TABLE fortune_tellers ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可能
CREATE POLICY "Fortune tellers are viewable by everyone" 
ON fortune_tellers FOR SELECT 
TO public 
USING (true);

-- 自身のプロフィールのみ編集可能
CREATE POLICY "Users can update their own fortune teller profile" 
ON fortune_tellers FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 自身のプロフィールのみ削除可能
CREATE POLICY "Users can delete their own fortune teller profile" 
ON fortune_tellers FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 認証済みユーザーのみプロフィール作成可能
CREATE POLICY "Authenticated users can create fortune teller profiles" 
ON fortune_tellers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);