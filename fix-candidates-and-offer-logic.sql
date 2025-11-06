-- Fix for candidates tab and offer logic issues
-- This script addresses the problems identified in the audit

-- 1. First, let's check the current state of candidates and notifications
SELECT 'CURRENT STATE AUDIT' as section;

-- Check candidates table
SELECT 'Candidates:' as info;
SELECT 
  c.*,
  p.title as event_title,
  pr.full_name as promoter_name,
  prof.full_name as talent_name,
  prof.email as talent_email
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr ON c.promoter_id = pr.id
LEFT JOIN profiles prof ON c.talent_id = prof.id
ORDER BY c.created_at DESC;

-- Check notifications for offers
SELECT 'Offer Notifications:' as info;
SELECT 
  n.*,
  p.title as event_title,
  prof.email as talent_email
FROM notifications n
LEFT JOIN posts p ON n.event_id = p.id
LEFT JOIN profiles prof ON n.user_id = prof.id
WHERE n.type = 'offer_received'
ORDER BY n.created_at DESC;

-- 2. Create a function to check if talent has already accepted an offer for any event
CREATE OR REPLACE FUNCTION has_talent_accepted_offer_for_promoter(
  talent_id_param UUID,
  promoter_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM candidates c
    WHERE c.talent_id = talent_id_param 
      AND c.promoter_id = promoter_id_param 
      AND c.status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to get all events for a promoter (even without candidates)
CREATE OR REPLACE FUNCTION get_promoter_events_with_candidates(
  promoter_id_param UUID
)
RETURNS TABLE (
  event_id UUID,
  event_title TEXT,
  candidate_count BIGINT,
  accepted_count BIGINT,
  pending_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as event_id,
    p.title as event_title,
    COUNT(c.id) as candidate_count,
    COUNT(CASE WHEN c.status = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_count
  FROM posts p
  LEFT JOIN candidates c ON p.id = c.event_id
  WHERE p.promoter_id = promoter_id_param
  GROUP BY p.id, p.title
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add comments for the new functions
COMMENT ON FUNCTION has_talent_accepted_offer_for_promoter(UUID, UUID) IS 'Checks if talent has already accepted an offer from promoter';
COMMENT ON FUNCTION get_promoter_events_with_candidates(UUID) IS 'Gets all promoter events with candidate counts';

-- 5. Test the functions
SELECT 'Testing new functions:' as section;

-- Test with a specific promoter (replace with actual promoter ID)
-- SELECT has_talent_accepted_offer_for_promoter('talent-id', 'promoter-id');

-- Get events for promoter
-- SELECT * FROM get_promoter_events_with_candidates('promoter-id');




