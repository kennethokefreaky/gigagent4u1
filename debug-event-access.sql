-- Debug event access issues
-- This script helps identify why the event fetch is failing

-- Check if the posts table exists and has data
SELECT 
    'Posts table info:' as info,
    COUNT(*) as total_posts,
    MIN(created_at) as oldest_post,
    MAX(created_at) as newest_post
FROM public.posts;

-- Check RLS status on posts table
SELECT 
    'RLS Status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'posts' AND schemaname = 'public';

-- Check RLS policies on posts table
SELECT 
    'RLS Policies:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'posts' AND schemaname = 'public';

-- Check if we can see any posts (this will show if RLS is blocking access)
SELECT 
    'Sample posts (if accessible):' as info,
    id,
    title,
    promoter_id,
    created_at
FROM public.posts 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any posts with specific patterns
SELECT 
    'Posts with UUID pattern:' as info,
    COUNT(*) as count
FROM public.posts 
WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Check for any posts that might be causing issues
SELECT 
    'Recent posts:' as info,
    id,
    title,
    promoter_id,
    created_at,
    LENGTH(id::text) as id_length
FROM public.posts 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
