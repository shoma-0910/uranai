/*
  # Clear all user data

  1. Changes
    - Delete all records from fortune_tellers table
    - Delete all records from profiles table
    - Delete all records from auth.users table

  Note: This is a one-time cleanup operation
*/

-- Delete all fortune teller records first (due to foreign key constraints)
DELETE FROM fortune_tellers;

-- Delete all profile records
DELETE FROM profiles;

-- Delete all auth users (this will cascade to related tables)
DELETE FROM auth.users;