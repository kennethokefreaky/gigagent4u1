-- Debug restore error - check posts table structure and constraints
-- Run this in Supabase SQL editor

-- 1. Check posts table structure
SELECT 'POSTS TABLE STRUCTURE' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check constraints on posts table
SELECT 'POSTS TABLE CONSTRAINTS' as section;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'posts' 
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. Check a sample post to see the data structure
SELECT 'SAMPLE POST DATA' as section;
SELECT * FROM posts LIMIT 1;

-- 4. Check trash table to see what data we're trying to restore
SELECT 'TRASH TABLE DATA' as section;
SELECT 
    original_post_id,
    post_data,
    removed_by,
    removed_at
FROM trash 
ORDER BY removed_at DESC 
LIMIT 3;

-- 5. Check if there are any unique constraints that might cause conflicts
SELECT 'UNIQUE CONSTRAINTS ON POSTS' as section;
SELECT 
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'posts' 
AND tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public';

-- 6. Check if there are any check constraints
SELECT 'CHECK CONSTRAINTS ON POSTS' as section;
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'posts' 
AND tc.constraint_type = 'CHECK'
AND tc.table_schema = 'public';

