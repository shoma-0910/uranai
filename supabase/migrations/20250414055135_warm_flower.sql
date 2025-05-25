/*
  # Add Fortune Teller Approval Functions

  1. Changes
    - Add approve_fortune_teller function
    - Add unapprove_fortune_teller function
    - Grant proper permissions for function execution

  2. Security
    - Functions use SECURITY DEFINER for proper access control
    - Only admin users can approve/unapprove fortune tellers
    - Functions are granted to authenticated and service_role
*/

-- Create function to approve fortune tellers
CREATE OR REPLACE FUNCTION approve_fortune_teller(target_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can approve fortune tellers';
  END IF;

  -- Update fortune teller approval status
  UPDATE fortune_tellers
  SET approved = TRUE
  WHERE id = target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fortune teller not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unapprove fortune tellers
CREATE OR REPLACE FUNCTION unapprove_fortune_teller(target_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can unapprove fortune tellers';
  END IF;

  -- Update fortune teller approval status
  UPDATE fortune_tellers
  SET approved = FALSE
  WHERE id = target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fortune teller not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
ALTER FUNCTION approve_fortune_teller(uuid) OWNER TO postgres;
ALTER FUNCTION unapprove_fortune_teller(uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION approve_fortune_teller(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION unapprove_fortune_teller(uuid) TO authenticated, service_role;