-- Check what columns actually exist in the posts table
-- Run this in Supabase SQL editor to see the actual schema

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there's a status column or similar
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
AND column_name LIKE '%status%';

-- Check a sample row to see what data exists
SELECT * FROM posts LIMIT 1;

