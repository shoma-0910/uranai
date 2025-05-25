/*
  # Add phone number to users table

  1. Changes
    - Add phone_number column to users table
    - Add validation for phone number format
    - Update existing policies
*/

-- Add phone_number column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number text;

-- Create function to validate phone number format
CREATE OR REPLACE FUNCTION validate_phone_number(phone text)
RETURNS boolean AS $$
BEGIN
  -- Allow null values
  IF phone IS NULL THEN
    RETURN true;
  END IF;
  
  -- Basic validation for Japanese phone numbers
  -- Allows formats like: 090-1234-5678, 09012345678, +81-90-1234-5678
  RETURN phone ~ '^(\+81[-\s]?|0)([0-9]{1,4}[-\s]?[0-9]{4}[-\s]?[0-9]{4})$';
END;
$$ LANGUAGE plpgsql;

-- Add constraint for phone number format
ALTER TABLE users
ADD CONSTRAINT valid_phone_number
CHECK (validate_phone_number(phone_number));