/*
  # Fix announcement function parameter order

  1. Changes
    - Update manage_announcement function to match frontend parameter order
    - Ensure consistent parameter naming and order
    - Keep existing functionality intact

  2. Security
    - Maintain existing security checks
    - Keep function as SECURITY DEFINER
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS manage_announcement;

-- Recreate function with correct parameter order
CREATE OR REPLACE FUNCTION manage_announcement(
  p_action text DEFAULT 'create',
  p_content text DEFAULT NULL,
  p_id uuid DEFAULT NULL,
  p_published_at timestamptz DEFAULT NULL,
  p_title text DEFAULT NULL
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