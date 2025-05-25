/*
  # Add Admin Management Feature

  1. Changes
    - Add function to grant admin privileges
    - Add function to revoke admin privileges
    - Add function to list all admins
    - Add proper security checks

  2. Security
    - Only existing admins can grant/revoke admin privileges
    - Functions use SECURITY DEFINER for proper access control
*/

-- Create function to grant admin privileges
CREATE OR REPLACE FUNCTION grant_admin_privileges(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT is_admin() INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: Only administrators can grant admin privileges';
  END IF;

  -- Update user type to admin
  UPDATE profiles
  SET user_type = 'admin'
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to revoke admin privileges
CREATE OR REPLACE FUNCTION revoke_admin_privileges(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_is_admin boolean;
  v_admin_count integer;
BEGIN
  -- Check if the current user is an admin
  SELECT is_admin() INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: Only administrators can revoke admin privileges';
  END IF;

  -- Count remaining admins
  SELECT COUNT(*) INTO v_admin_count
  FROM profiles
  WHERE user_type = 'admin';

  -- Prevent removing the last admin
  IF v_admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last administrator';
  END IF;

  -- Update user type to user
  UPDATE profiles
  SET user_type = 'user'
  WHERE id = target_user_id
  AND id != auth.uid(); -- Prevent self-demotion

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to list all admins
CREATE OR REPLACE FUNCTION list_admins()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz
) AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view admin list';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(p.full_name, '未設定') as full_name,
    p.created_at
  FROM profiles p
  WHERE p.user_type = 'admin'
  ORDER BY p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;