-- Immediate fix for undefined event titles
-- This script will update all NULL/empty titles and verify the changes

-- 1. Check current state of titles
SELECT 'CURRENT TITLES STATE' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.email as promoter_email,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
ORDER BY p.created_at DESC;

-- 2. Update ALL NULL or empty titles with proper names
UPDATE posts 
SET title = CASE 
  WHEN title IS NULL OR TRIM(title) = '' THEN 
    'Event ' || TO_CHAR(created_at, 'MM/DD/YYYY') || ' - ' || SUBSTRING(id::text, 1, 8)
  ELSE title
END
WHERE title IS NULL OR TRIM(title) = '';

-- 3. Verify the updates
SELECT 'UPDATED TITLES STATE' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.email as promoter_email,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
ORDER BY p.created_at DESC;

-- 4. Check if there are still any NULL titles
SELECT 'REMAINING NULL TITLES' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.email as promoter_email
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
WHERE p.title IS NULL OR TRIM(p.title) = ''
ORDER BY p.created_at DESC;

-- 5. Force update the specific event that's showing as undefined
-- Replace 'a7ed1475-e3f9-444d-ba78-1e6c5a24ebe0' with the actual ID from your console
UPDATE posts 
SET title = 'Looking for Wrestlers'
WHERE id = 'a7ed1475-e3f9-444d-ba78-1e6c5a24ebe0';

-- 6. Verify the specific event update
SELECT 'SPECIFIC EVENT UPDATE' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.email as promoter_email
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
WHERE p.id = 'a7ed1475-e3f9-444d-ba78-1e6c5a24ebe0';




