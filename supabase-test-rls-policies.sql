-- Test RLS policies for message-related tables
-- Run this in your Supabase SQL Editor

-- Check RLS status for all message-related tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('message_participants', 'messages', 'posts', 'profiles')
ORDER BY tablename;

-- Check if there are any RLS policies on message_participants
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('message_participants', 'messages', 'posts', 'profiles')
ORDER BY tablename, policyname;

-- Test if the current user can access message_participants
SELECT 'Testing message_participants access:' as info;
SELECT COUNT(*) as total_participants FROM message_participants;

-- Test if the current user can access posts
SELECT 'Testing posts access:' as info;
SELECT COUNT(*) as total_posts FROM posts;

-- Test if the current user can access profiles
SELECT 'Testing profiles access:' as info;
SELECT COUNT(*) as total_profiles FROM profiles;
