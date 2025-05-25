/*
  # Fix announcement management function ambiguity

  1. Changes
    - Drop existing ambiguous manage_announcement functions
    - Create new manage_announcement_v2 function with clear parameter order
    - Add security policy to ensure only admins can execute the function

  2. Security
    - Function can only be executed by authenticated users with admin privileges
*/

-- Drop existing ambiguous functions
DROP FUNCTION IF EXISTS manage_announcement(uuid, text, text, timestamp with time zone, text);
DROP FUNCTION IF EXISTS manage_announcement(text, text, uuid, timestamp with time zone, text);

-- Create new function with clear parameter order
CREATE OR REPLACE FUNCTION manage_announcement_v2(
  p_action text,
  p_id uuid,
  p_title text,
  p_content text,
  p_published_at timestamp with time zone
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin access
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  CASE p_action
    WHEN 'create' THEN
      INSERT INTO announcements (title, content, published_at)
      VALUES (p_title, p_content, p_published_at);

    WHEN 'update' THEN
      UPDATE announcements
      SET
        title = p_title,
        content = p_content,
        published_at = p_published_at,
        updated_at = now()
      WHERE id = p_id;

    WHEN 'delete' THEN
      DELETE FROM announcements
      WHERE id = p_id;

    ELSE
      RAISE EXCEPTION 'Invalid action';
  END CASE;
END;
$$;