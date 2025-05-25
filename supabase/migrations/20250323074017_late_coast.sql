/*
  # Fix Admin Authentication

  1. Changes
    - Clean up existing admin data
    - Create new admin user with proper authentication configuration
    - Set up admin profile with correct settings

  2. Security
    - Admin credentials:
      - Email: admin@example.com
      - Password: admin123
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
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  last_sign_in_at,
  confirmation_sent_at
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
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  now(),
  now()
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