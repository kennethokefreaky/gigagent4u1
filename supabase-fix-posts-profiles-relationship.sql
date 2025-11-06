-- Fix the missing relationship between posts and profiles tables
-- Run this in your Supabase SQL Editor

-- First, let's check the current structure of both tables
SELECT 'Posts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if there's a promoter_id column in posts that should reference profiles
SELECT 'Posts promoter_id column:' as info;
SELECT promoter_id, COUNT(*) as count 
FROM posts 
GROUP BY promoter_id 
LIMIT 5;

-- Check if profiles has an id column that matches
SELECT 'Profiles id column:' as info;
SELECT id, full_name, email 
FROM profiles 
LIMIT 5;

-- Create the missing foreign key relationship
-- This assumes posts.promoter_id should reference profiles.id
ALTER TABLE posts 
ADD CONSTRAINT posts_promoter_id_fkey 
FOREIGN KEY (promoter_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Verify the relationship was created
SELECT 'Foreign key created successfully' as info;
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
