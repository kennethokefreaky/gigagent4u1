-- Check current RLS policies for place_feedback and place_ratings tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('place_feedback', 'place_ratings')
ORDER BY tablename, policyname;
