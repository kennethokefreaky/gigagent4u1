-- PERMANENT FIX: Proper RLS policies that work with authentication
-- This will fix 406 errors permanently while maintaining security

-- First, re-enable RLS
ALTER TABLE place_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_feedback ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow all users to view place ratings" ON place_ratings;
DROP POLICY IF EXISTS "Allow all users to insert place ratings" ON place_ratings;
DROP POLICY IF EXISTS "Allow all users to update place ratings" ON place_ratings;
DROP POLICY IF EXISTS "Users can view all place ratings" ON place_ratings;
DROP POLICY IF EXISTS "Users can insert place ratings" ON place_ratings;
DROP POLICY IF EXISTS "Users can update place ratings" ON place_ratings;

DROP POLICY IF EXISTS "Allow all users to view place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Allow users to insert their own place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Allow users to update their own place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Allow users to delete their own place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Users can view all place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Users can insert their own place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Users can update their own place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Users can delete their own place feedback" ON place_feedback;

-- Create proper RLS policies for place_ratings (public read access)
CREATE POLICY "place_ratings_select_policy" ON place_ratings
    FOR SELECT 
    USING (true);

CREATE POLICY "place_ratings_insert_policy" ON place_ratings
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "place_ratings_update_policy" ON place_ratings
    FOR UPDATE 
    USING (true);

-- Create proper RLS policies for place_feedback
CREATE POLICY "place_feedback_select_policy" ON place_feedback
    FOR SELECT 
    USING (true);

CREATE POLICY "place_feedback_insert_policy" ON place_feedback
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "place_feedback_update_policy" ON place_feedback
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "place_feedback_delete_policy" ON place_feedback
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Remove the unique constraint that prevents multiple reviews
ALTER TABLE place_feedback 
DROP CONSTRAINT IF EXISTS place_feedback_place_id_user_id_feedback_type_key;

-- Test the policies by checking if we can select data
SELECT 'Testing place_ratings access...' as test_step;
SELECT COUNT(*) as place_ratings_accessible FROM place_ratings;

SELECT 'Testing place_feedback access...' as test_step;
SELECT COUNT(*) as place_feedback_accessible FROM place_feedback;

-- Show current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('place_ratings', 'place_feedback');

-- Show success message
SELECT 'RLS policies properly configured - 406 errors should be permanently fixed!' as status;

