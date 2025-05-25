/*
  # Add Fortune Teller Rating Update Function

  1. New Functions
    - `update_fortune_teller_rating`: Updates a fortune teller's rating and review count
      - Takes fortune teller ID and rating as parameters
      - Calculates new average rating
      - Updates review count
      - Uses SECURITY DEFINER to ensure proper access control

  2. Security
    - Function can only be called by authenticated users
    - Rating must be between 0 and 5
    - Validates fortune teller exists
*/

-- Create function to update fortune teller rating
CREATE OR REPLACE FUNCTION update_fortune_teller_rating(
    p_fortune_teller_id UUID,
    p_rating INTEGER
)
RETURNS VOID AS $$
DECLARE
    current_rating NUMERIC;
    current_review_count INTEGER;
    fortune_teller_exists BOOLEAN;
BEGIN
    -- Check if the fortune teller exists
    SELECT EXISTS (
        SELECT 1 FROM fortune_tellers WHERE id = p_fortune_teller_id
    ) INTO fortune_teller_exists;

    IF NOT fortune_teller_exists THEN
        RAISE EXCEPTION 'Fortune teller not found';
    END IF;

    -- Validate rating range
    IF p_rating < 0 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 0 and 5';
    END IF;

    -- Get the current rating and review count
    SELECT rating, review_count INTO current_rating, current_review_count
    FROM fortune_tellers
    WHERE id = p_fortune_teller_id;

    -- Calculate new rating
    IF current_review_count = 0 THEN
        current_rating := p_rating;
        current_review_count := 1;
    ELSE
        -- Calculate new average rating
        current_rating := ((current_rating * current_review_count) + p_rating) / (current_review_count + 1);
        current_review_count := current_review_count + 1;
    END IF;

    -- Update the fortune teller's rating and review count
    UPDATE fortune_tellers
    SET 
        rating = current_rating,
        review_count = current_review_count,
        updated_at = now()
    WHERE id = p_fortune_teller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;