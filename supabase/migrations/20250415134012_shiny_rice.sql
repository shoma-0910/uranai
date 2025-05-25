/*
  # Fix Fortune Teller Approval Function

  1. Changes
    - Update approve_fortune_teller function to handle errors gracefully
    - Add proper error handling and validation
    - Ensure notifications are created properly

  2. Security
    - Maintain admin-only access
    - Add proper error messages
*/

-- Drop existing function
DROP FUNCTION IF EXISTS approve_fortune_teller(uuid, boolean);

-- Create improved approve_fortune_teller function
CREATE OR REPLACE FUNCTION approve_fortune_teller(fortune_teller_id uuid, should_approve boolean)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_fortune_teller_exists boolean;
BEGIN
  -- Check admin privileges
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can approve fortune tellers';
  END IF;

  -- Check if fortune teller exists
  SELECT EXISTS (
    SELECT 1 FROM fortune_tellers WHERE id = fortune_teller_id
  ) INTO v_fortune_teller_exists;

  IF NOT v_fortune_teller_exists THEN
    RAISE EXCEPTION 'Fortune teller not found';
  END IF;

  -- Get user_id for notification
  SELECT user_id INTO v_user_id
  FROM fortune_tellers
  WHERE id = fortune_teller_id;

  -- Update fortune teller status
  UPDATE fortune_tellers
  SET 
    approved = should_approve,
    available = should_approve,
    updated_at = now()
  WHERE id = fortune_teller_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    content,
    type
  )
  VALUES (
    v_user_id,
    CASE 
      WHEN should_approve THEN '占い師として承認されました'
      ELSE '占い師承認が取り消されました'
    END,
    CASE 
      WHEN should_approve THEN 'おめでとうございます！占い師として承認されました。予約の受付を開始できます。'
      ELSE '申し訳ありませんが、占い師としての承認が取り消されました。詳細は管理者にお問い合わせください。'
    END,
    CASE 
      WHEN should_approve THEN 'fortune_teller_approved'
      ELSE 'fortune_teller_unapproved'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE NOTICE 'Error in approve_fortune_teller: %', SQLERRM;
    -- Re-raise the error
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;