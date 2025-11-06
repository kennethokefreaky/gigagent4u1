-- Fix NULL event titles and promoter names
-- This script addresses the data integrity issues found in the audit

-- 1. First, let's see the current problematic data
SELECT 'CURRENT PROBLEMATIC DATA' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.full_name as promoter_name,
  pr.email as promoter_email,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
WHERE p.title IS NULL OR p.title = '' OR pr.full_name IS NULL
ORDER BY p.created_at DESC;

-- 2. Fix NULL/empty event titles
UPDATE posts 
SET title = 'Event ' || SUBSTRING(id::text, 1, 8)  -- Use first 8 chars of UUID for uniqueness
WHERE title IS NULL OR TRIM(title) = '';

-- 3. Verify the title updates
SELECT 'UPDATED EVENT TITLES' as section;
SELECT 
  p.id,
  p.title,
  p.promoter_id,
  pr.email as promoter_email,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
ORDER BY p.created_at DESC;

-- 4. Create a function to get events with proper fallbacks
CREATE OR REPLACE FUNCTION get_events_with_fallbacks(promoter_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  promoter_id UUID,
  promoter_name TEXT,
  promoter_email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.title, 'Untitled Event') as title,
    p.promoter_id,
    COALESCE(pr.full_name, pr.email, 'Unknown Promoter') as promoter_name,
    pr.email as promoter_email,
    p.created_at,
    p.updated_at
  FROM posts p
  LEFT JOIN profiles pr ON p.promoter_id = pr.id
  WHERE (promoter_id_param IS NULL OR p.promoter_id = promoter_id_param)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test the function with fallbacks
SELECT 'TESTING FALLBACK FUNCTION' as section;
SELECT * FROM get_events_with_fallbacks();

-- 6. Test for specific promoter
SELECT 'TESTING FOR SPECIFIC PROMOTER' as section;
SELECT * FROM get_events_with_fallbacks('ed484bcb-20a2-47cb-b069-29660a824f10');

-- 7. Add comment for the function
COMMENT ON FUNCTION get_events_with_fallbacks(UUID) IS 'Gets events with proper title and promoter name fallbacks';

-- 8. Update the posts table to prevent future NULL titles
ALTER TABLE posts ALTER COLUMN title SET DEFAULT 'Untitled Event';
ALTER TABLE posts ALTER COLUMN title SET NOT NULL;

-- 9. Verify the constraint
SELECT 'VERIFYING CONSTRAINTS' as section;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name = 'title';




