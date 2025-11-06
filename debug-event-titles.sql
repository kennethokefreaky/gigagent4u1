-- Debug why events are showing as "Untitled Event"
-- Check the actual event data in the database

-- 1. Check all events for the current promoter
SELECT 'CURRENT PROMOTER EVENTS' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.full_name as promoter_name,
  pr.email as promoter_email,
  p.created_at,
  p.updated_at
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
WHERE p.promoter_id = 'ed484bcb-20a2-47cb-b069-29660a824f10'  -- Replace with your actual promoter ID
ORDER BY p.created_at DESC;

-- 2. Check if there are events with null/empty titles
SELECT 'EVENTS WITH NULL/EMPTY TITLES' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.email as promoter_email,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
WHERE p.promoter_id = 'ed484bcb-20a2-47cb-b069-29660a824f10'  -- Replace with your actual promoter ID
  AND (p.title IS NULL OR p.title = '' OR p.title = 'NULL')
ORDER BY p.created_at DESC;

-- 3. Check all events in the system
SELECT 'ALL EVENTS IN SYSTEM' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.email as promoter_email,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Check the posts table structure
SELECT 'POSTS TABLE STRUCTURE' as section;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name IN ('id', 'title', 'promoter_id', 'created_at')
ORDER BY ordinal_position;




