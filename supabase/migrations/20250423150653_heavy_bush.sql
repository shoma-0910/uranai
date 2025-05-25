/*
  # Add announcements management

  1. Changes
    - Drop and recreate announcements table
    - Add RLS policies for announcements
    - Add admin functions for managing announcements

  2. Security
    - Only admins can manage announcements
    - Everyone can view published announcements
*/

-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS announcements CASCADE;

-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view announcements"
ON announcements
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage announcements"
ON announcements
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create function to manage announcements
CREATE OR REPLACE FUNCTION manage_announcement(
  p_id uuid DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_content text DEFAULT NULL,
  p_published_at timestamptz DEFAULT NULL,
  p_action text DEFAULT 'create'
)
RETURNS uuid AS $$
DECLARE
  v_announcement_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can manage announcements';
  END IF;

  CASE p_action
    WHEN 'create' THEN
      INSERT INTO announcements (title, content, published_at)
      VALUES (p_title, p_content, COALESCE(p_published_at, now()))
      RETURNING id INTO v_announcement_id;

    WHEN 'update' THEN
      UPDATE announcements
      SET
        title = COALESCE(p_title, title),
        content = COALESCE(p_content, content),
        published_at = COALESCE(p_published_at, published_at),
        updated_at = now()
      WHERE id = p_id
      RETURNING id INTO v_announcement_id;

    WHEN 'delete' THEN
      DELETE FROM announcements
      WHERE id = p_id
      RETURNING id INTO v_announcement_id;

    ELSE
      RAISE EXCEPTION 'Invalid action: %', p_action;
  END CASE;

  RETURN v_announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;