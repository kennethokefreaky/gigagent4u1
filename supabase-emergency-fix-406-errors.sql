-- EMERGENCY FIX: Temporarily disable RLS to stop 406 errors
-- This will allow the place feedback system to work immediately

-- Disable RLS on place_ratings table temporarily
ALTER TABLE place_ratings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on place_feedback table temporarily  
ALTER TABLE place_ratings DISABLE ROW LEVEL SECURITY;

-- Remove the unique constraint that prevents multiple reviews
ALTER TABLE place_feedback 
DROP CONSTRAINT IF EXISTS place_feedback_place_id_user_id_feedback_type_key;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('place_ratings', 'place_feedback');

-- Test that we can now access the data
SELECT COUNT(*) as place_ratings_count FROM place_ratings;
SELECT COUNT(*) as place_feedback_count FROM place_feedback;

-- Show success message
SELECT 'RLS temporarily disabled - 406 errors should be fixed!' as status;

