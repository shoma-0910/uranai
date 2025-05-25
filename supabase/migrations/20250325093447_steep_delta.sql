/*
  # Add announcements feature

  1. New Tables
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text) - お知らせのタイトル
      - `content` (text) - お知らせの内容
      - `created_at` (timestamptz) - 作成日時
      - `published_at` (timestamptz) - 公開日時

  2. Security
    - Enable RLS
    - Add policies for:
      - Everyone can view published announcements
      - Only admins can manage announcements
*/

-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view announcements"
ON announcements
FOR SELECT
TO public
USING (true);

-- Create policy for admins to manage announcements
CREATE POLICY "Admins can manage announcements"
ON announcements
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create function to list announcements for admin
CREATE OR REPLACE FUNCTION get_admin_announcements()
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  created_at timestamptz,
  published_at timestamptz
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT a.id, a.title, a.content, a.created_at, a.published_at
  FROM announcements a
  ORDER BY a.published_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;