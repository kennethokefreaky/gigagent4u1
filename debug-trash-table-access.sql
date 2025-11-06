-- Debug Trash Table Access Issues
-- This script helps identify why we're getting 406 errors when accessing the trash table

-- 1. Check if trash table exists and its structure
SELECT 
    'TRASH TABLE STRUCTURE' as info_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'trash' 
ORDER BY ordinal_position;

-- 2. Check RLS policies on trash table
SELECT 
    'TRASH TABLE POLICIES' as info_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trash';

-- 3. Check if we can select from trash table (basic test)
SELECT 
    'TRASH TABLE ACCESS TEST' as info_type,
    COUNT(*) as total_records
FROM trash;

-- 4. Check specific records that are causing 406 errors
SELECT 
    'PROBLEMATIC RECORDS' as info_type,
    original_post_id,
    post_data->>'title' as title,
    removed_at
FROM trash 
WHERE original_post_id IN (
    '3f529bec-ffbc-4ab1-a2ff-3d1f6213cb59',
    'a55d650a-5c20-4e47-b600-a77d9d57df50'
);

-- 5. Test the exact query that's failing
SELECT 
    'EXACT FAILING QUERY TEST' as info_type,
    post_data
FROM trash 
WHERE original_post_id = '3f529bec-ffbc-4ab1-a2ff-3d1f6213cb59';

-- 6. Check if original_post_id column type is correct
SELECT 
    'COLUMN TYPE CHECK' as info_type,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'trash' 
AND column_name = 'original_post_id';
