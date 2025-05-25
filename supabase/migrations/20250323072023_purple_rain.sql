/*
  # Fix admin login issues

  1. Changes
    - Drop and recreate admin user with proper authentication
    - Ensure admin user exists in both auth.users and profiles tables
    - Set proper password encryption and email confirmation

  2. Security
    - Admin credentials: admin@example.com / admin123
    - Email confirmation is enabled by default
*/

-- First, clean up any existing admin entries
DELETE FROM auth.users WHERE email = 'admin@example.com';
DELETE FROM profiles WHERE email = 'admin@example.com';

-- Create admin user in auth.users
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
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"System Administrator"}'::jsonb,
  true,
  'authenticated'
);

-- Create admin profile
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@example.com',
  'System Administrator',
  'admin',
  now(),
  now()
);