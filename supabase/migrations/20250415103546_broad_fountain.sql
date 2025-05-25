/*
  # Add fortune teller approval functionality

  1. Changes
    - Add admin policy to update fortune teller approval status
    - Add function to approve fortune tellers
    - Add function to get unapproved fortune tellers

  2. Security
    - Only admins can approve/unapprove fortune tellers
    - Functions use SECURITY DEFINER for proper access control
*/

-- Create policy for admins to update fortune tellers
CREATE POLICY "Admins can update fortune tellers"
ON fortune_tellers
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create function to approve fortune teller
CREATE OR REPLACE FUNCTION approve_fortune_teller(fortune_teller_id uuid, should_approve boolean)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can approve fortune tellers';
  END IF;

  UPDATE fortune_tellers
  SET 
    approved = should_approve,
    updated_at = now()
  WHERE id = fortune_teller_id;

  -- Create notification for the fortune teller
  INSERT INTO notifications (
    user_id,
    title,
    content,
    type
  )
  SELECT
    user_id,
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
  FROM fortune_tellers
  WHERE id = fortune_teller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unapproved fortune tellers
CREATE OR REPLACE FUNCTION get_unapproved_fortune_tellers()
RETURNS TABLE (
  id uuid,
  name text,
  title text,
  bio text,
  experience_years integer,
  specialties text[],
  created_at timestamptz,
  user_email text,
  user_name text
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view unapproved fortune tellers';
  END IF;

  RETURN QUERY
  SELECT 
    ft.id,
    ft.name,
    ft.title,
    ft.bio,
    ft.experience_years,
    ft.specialties,
    ft.created_at,
    p.email as user_email,
    p.full_name as user_name
  FROM fortune_tellers ft
  JOIN profiles p ON ft.user_id = p.id
  WHERE ft.approved = false
  ORDER BY ft.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;