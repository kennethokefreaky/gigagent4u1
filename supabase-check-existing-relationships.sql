-- Check what foreign key relationships actually exist
-- Run this in your Supabase SQL Editor

-- Check all foreign key constraints on posts table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'posts';

-- Check all foreign key constraints on messages table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'messages';

-- Test the exact query that's failing
SELECT 'Testing the exact query from messageUtils.ts:' as info;

-- This should work if the relationship exists
SELECT 
  mp.event_id,
  mp.last_read_at,
  p.id,
  p.title,
  p.promoter_id,
  pr.full_name,
  pr.profile_image_url
FROM message_participants mp
INNER JOIN posts p ON mp.event_id = p.id
INNER JOIN profiles pr ON p.promoter_id = pr.id
WHERE mp.user_id = '9c7908c5-9295-416d-bc7a-051fb05e6ded'
LIMIT 5;
