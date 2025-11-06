-- Audit candidates tab events issue
-- Check what events are being returned and why there are duplicates

-- 1. Check all events for the current promoter
SELECT 'PROMOTER EVENTS AUDIT' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.full_name as promoter_name,
  pr.email as promoter_email,
  p.created_at,
  COUNT(c.id) as candidate_count
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
LEFT JOIN candidates c ON p.id = c.event_id
WHERE p.promoter_id = 'ed484bcb-20a2-47cb-b069-29660a824f10'  -- Replace with actual promoter ID
GROUP BY p.id, p.title, p.promoter_id, pr.full_name, pr.email, p.created_at
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
WHERE p.promoter_id = 'ed484bcb-20a2-47cb-b069-29660a824f10'  -- Replace with actual promoter ID
  AND (p.title IS NULL OR p.title = '' OR p.title = 'NULL')
ORDER BY p.created_at DESC;

-- 3. Check all events (not just for one promoter)
SELECT 'ALL EVENTS AUDIT' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.email as promoter_email,
  p.created_at,
  COUNT(c.id) as candidate_count
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
LEFT JOIN candidates c ON p.id = c.event_id
GROUP BY p.id, p.title, p.promoter_id, pr.email, p.created_at
ORDER BY p.created_at DESC;

-- 4. Check for duplicate event titles
SELECT 'DUPLICATE EVENT TITLES' as section;
SELECT 
  p.title,
  COUNT(*) as count,
  STRING_AGG(p.id::text, ', ') as event_ids,
  STRING_AGG(pr.email, ', ') as promoter_emails
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
WHERE p.title IS NOT NULL AND p.title != ''
GROUP BY p.title
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 5. Check candidates table for any issues
SELECT 'CANDIDATES TABLE AUDIT' as section;
SELECT 
  c.id,
  c.event_id,
  c.event_title,
  c.promoter_id,
  c.talent_id,
  c.status,
  p.title as actual_event_title,
  pr.email as promoter_email
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr ON c.promoter_id = pr.id
ORDER BY c.created_at DESC;




