-- Fix null names in candidates table by implementing email fallbacks
-- This script updates existing candidates with proper names using email fallbacks

-- 1. First, let's see the current state
SELECT 'CURRENT STATE - NULL NAMES' as section;
SELECT 
  c.id,
  c.talent_name,
  c.promoter_id,
  c.talent_id,
  p_talent.full_name as talent_full_name,
  p_talent.email as talent_email,
  p_promoter.full_name as promoter_full_name,
  p_promoter.email as promoter_email
FROM candidates c
LEFT JOIN profiles p_talent ON c.talent_id = p_talent.id
LEFT JOIN profiles p_promoter ON c.promoter_id = p_promoter.id
WHERE c.talent_name IS NULL OR c.talent_name = '' OR c.talent_name = 'NULL'
ORDER BY c.created_at DESC;

-- 2. Update talent_name with email fallback for null/empty values
UPDATE candidates 
SET talent_name = COALESCE(
  (SELECT p.full_name FROM profiles p WHERE p.id = candidates.talent_id),
  (SELECT p.email FROM profiles p WHERE p.id = candidates.talent_id),
  'Unknown Talent'
)
WHERE talent_name IS NULL OR talent_name = '' OR talent_name = 'NULL';

-- 3. Add promoter_name column if it doesn't exist (with email fallback)
DO $$ 
BEGIN
  -- Check if promoter_name column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidates' 
    AND column_name = 'promoter_name'
  ) THEN
    -- Add promoter_name column
    ALTER TABLE candidates ADD COLUMN promoter_name TEXT;
    
    -- Update promoter_name with email fallback
    UPDATE candidates 
    SET promoter_name = COALESCE(
      (SELECT p.full_name FROM profiles p WHERE p.id = candidates.promoter_id),
      (SELECT p.email FROM profiles p WHERE p.id = candidates.promoter_id),
      'Unknown Promoter'
    );
  ELSE
    -- Column exists, just update the values
    UPDATE candidates 
    SET promoter_name = COALESCE(
      (SELECT p.full_name FROM profiles p WHERE p.id = candidates.promoter_id),
      (SELECT p.email FROM profiles p WHERE p.id = candidates.promoter_id),
      'Unknown Promoter'
    )
    WHERE promoter_name IS NULL OR promoter_name = '' OR promoter_name = 'NULL';
  END IF;
END $$;

-- 4. Verify the updates
SELECT 'AFTER UPDATE - VERIFICATION' as section;
SELECT 
  c.id,
  c.talent_name,
  c.promoter_name,
  p_talent.email as talent_email,
  p_promoter.email as promoter_email,
  c.created_at
FROM candidates c
LEFT JOIN profiles p_talent ON c.talent_id = p_talent.id
LEFT JOIN profiles p_promoter ON c.promoter_id = p_promoter.id
ORDER BY c.created_at DESC;

-- 5. Drop existing function first (if it exists)
DROP FUNCTION IF EXISTS get_candidate_with_fallback_names(UUID);

-- 6. Create a function to get candidate with proper name fallbacks
CREATE OR REPLACE FUNCTION get_candidate_with_fallback_names(candidate_id UUID)
RETURNS TABLE (
  id UUID,
  talent_id UUID,
  promoter_id UUID,
  event_id UUID,
  event_title TEXT,
  offer_amount TEXT,
  status TEXT,
  talent_name TEXT,
  promoter_name TEXT,
  talent_email TEXT,
  promoter_email TEXT,
  talent_categories TEXT[],
  talent_location TEXT,
  talent_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.talent_id,
    c.promoter_id,
    c.event_id,
    c.event_title,
    c.offer_amount,
    c.status,
    COALESCE(c.talent_name, p_talent.full_name, p_talent.email, 'Unknown Talent') as talent_name,
    COALESCE(c.promoter_name, p_promoter.full_name, p_promoter.email, 'Unknown Promoter') as promoter_name,
    p_talent.email as talent_email,
    p_promoter.email as promoter_email,
    c.talent_categories,
    c.talent_location,
    c.talent_image_url,
    c.created_at,
    c.updated_at
  FROM candidates c
  LEFT JOIN profiles p_talent ON c.talent_id = p_talent.id
  LEFT JOIN profiles p_promoter ON c.promoter_id = p_promoter.id
  WHERE c.id = candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add comment for the function
COMMENT ON FUNCTION get_candidate_with_fallback_names(UUID) IS 'Gets candidate with proper name fallbacks using email when full_name is null';

-- 8. Test the function
SELECT 'TESTING FALLBACK FUNCTION' as section;
SELECT * FROM get_candidate_with_fallback_names(
  (SELECT id FROM candidates LIMIT 1)
);
