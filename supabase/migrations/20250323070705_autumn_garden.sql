/*
  # Fix Admin Setup and Permissions

  1. Changes
    - Create admin user in auth.users with proper password
    - Update admin profile with correct permissions
    - Add grant/revoke admin functions
    - Add admin policies

  2. Security
    - Only authenticated admins can access admin functions
    - Secure function execution with SECURITY DEFINER
*/

-- First, ensure we have an admin user in auth.users
DO $$ 
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000000';
  v_email text := 'admin@example.com';
  v_password text := 'admin123';
BEGIN
  -- Try to update existing profile to admin if exists
  UPDATE profiles 
  SET user_type = 'admin',
      full_name = 'System Administrator',
      email = v_email
  WHERE id = v_user_id;

  -- If no rows were updated, insert new admin
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, full_name, user_type)
    VALUES (v_user_id, v_email, 'System Administrator', 'admin');
  END IF;

  -- Ensure admin exists in auth.users with proper password
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_user_id
  ) THEN
    -- Update existing admin user
    UPDATE auth.users
    SET 
      email = v_email,
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"full_name":"System Administrator"}'::jsonb,
      is_super_admin = true,
      role = 'authenticated'
    WHERE id = v_user_id;
  ELSE
    -- Create new admin user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"System Administrator"}'::jsonb,
      true,
      'authenticated'
    );
  END IF;
END $$;

-- Drop existing policies and functions
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
DROP FUNCTION IF EXISTS list_admins();
DROP FUNCTION IF EXISTS get_admin_bookings();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS grant_admin_privileges(uuid);
DROP FUNCTION IF EXISTS revoke_admin_privileges(uuid);

-- Create improved admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  v_user_type text;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Return false if no user is authenticated
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check user type
  SELECT user_type INTO v_user_type
  FROM profiles
  WHERE id = v_user_id;

  RETURN COALESCE(v_user_type = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin bookings function
CREATE OR REPLACE FUNCTION get_admin_bookings()
RETURNS TABLE (
  id uuid,
  start_time timestamptz,
  duration_minutes integer,
  total_price integer,
  status text,
  notes text,
  created_at timestamptz,
  user_email text,
  user_name text,
  fortune_teller_name text,
  fortune_teller_title text
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.start_time,
    b.duration_minutes,
    b.total_price,
    b.status,
    b.notes,
    b.created_at,
    p.email as user_email,
    COALESCE(p.full_name, '未設定') as user_name,
    ft.name as fortune_teller_name,
    ft.title as fortune_teller_title
  FROM bookings b
  JOIN profiles p ON b.user_id = p.id
  JOIN fortune_tellers ft ON b.fortune_teller_id = ft.id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to list admins
CREATE OR REPLACE FUNCTION list_admins()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  user_type text,
  created_at timestamptz
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view admin list';
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.user_type, p.created_at
  FROM profiles p
  WHERE p.user_type = 'admin'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to grant admin privileges
CREATE OR REPLACE FUNCTION grant_admin_privileges(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can grant admin privileges';
  END IF;

  -- Update user type to admin
  UPDATE profiles
  SET user_type = 'admin'
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to revoke admin privileges
CREATE OR REPLACE FUNCTION revoke_admin_privileges(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can revoke admin privileges';
  END IF;

  -- Prevent revoking privileges from the system admin
  IF target_user_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'Cannot revoke privileges from system administrator';
  END IF;

  -- Update user type to regular user
  UPDATE profiles
  SET user_type = 'user'
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policies
CREATE POLICY "Admin can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());

-- Add policy for admin to update profiles
CREATE POLICY "Admin can update profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());