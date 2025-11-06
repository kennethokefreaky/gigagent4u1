-- Fix the foreign key relationship to point to profiles instead of auth.users
-- Run this in your Supabase SQL Editor

-- First, drop the existing incorrect foreign key
ALTER TABLE posts DROP CONSTRAINT posts_promoter_id_fkey;

-- Now create the correct foreign key pointing to profiles.id
ALTER TABLE posts 
ADD CONSTRAINT posts_promoter_id_fkey 
FOREIGN KEY (promoter_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Verify the fix worked
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
  AND tc.table_name = 'posts'
  AND kcu.column_name = 'promoter_id';

-- Test the relationship works
SELECT 'Testing the fixed relationship:' as info;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.full_name,
  pr.profile_image_url
FROM posts p
INNER JOIN profiles pr ON p.promoter_id = pr.id
LIMIT 3;
