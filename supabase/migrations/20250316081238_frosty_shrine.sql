/*
  # Clear all user data

  1. Changes
    - Delete all records from fortune_tellers table
    - Delete all records from profiles table
    - Reset sequences and clean up

  Note: This is a one-time cleanup operation
*/

-- Delete all fortune teller records
DELETE FROM fortune_tellers;

-- Delete all profile records
DELETE FROM profiles;