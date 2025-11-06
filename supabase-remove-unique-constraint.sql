-- Remove unique constraint to allow multiple reviews per user per place
-- This fixes the 409 Conflict error when adding multiple reviews

-- Drop the unique constraint that's preventing multiple reviews
ALTER TABLE place_feedback 
DROP CONSTRAINT IF EXISTS place_feedback_place_id_user_id_feedback_type_key;

-- Verify the constraint is removed
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'place_feedback'::regclass 
AND contype = 'u';

-- Test that multiple reviews can now be added
SELECT 'Unique constraint removed - multiple reviews per user now allowed!' as status;

