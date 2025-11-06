-- Check what's in the trash table
-- This will show posts that were "ended" and moved to trash

-- 1. Check if trash table exists and what's in it
SELECT 
    'TRASH TABLE CHECK' as source,
    original_post_id as id,
    post_data->>'title' as title,
    'removed' as status,
    removed_at as created_at,
    post_data->>'promoter_id' as promoter_id,
    reason
FROM trash 
ORDER BY removed_at DESC;

-- 2. Count posts in each table
SELECT 
    'POSTS COUNT' as source,
    'posts' as table_name,
    COUNT(*) as count
FROM posts

UNION ALL

SELECT 
    'TRASH COUNT' as source,
    'trash' as table_name,
    COUNT(*) as count
FROM trash;

-- 3. Check if any posts in trash match the frontend
-- Look for "need a wrestler" specifically
SELECT 
    'MATCHING TRASH POSTS' as source,
    original_post_id as id,
    post_data->>'title' as title,
    removed_at,
    reason,
    'This should show in Past Events' as note
FROM trash 
WHERE post_data->>'title' ILIKE '%wrestler%'
   OR post_data->>'title' ILIKE '%yello%'
ORDER BY removed_at DESC;
