-- CHECK POSTS TABLE STRUCTURE
-- This will show us the actual column names in the posts table
-- Run this in your Supabase SQL editor

SELECT 'POSTS TABLE COLUMNS' as section;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check a sample row to see the data
SELECT 'SAMPLE POSTS DATA' as section;
SELECT * FROM posts LIMIT 1;
