-- Update existing candidate records with proper names from profiles table
-- This fixes the NULL promoter_name and talent_name issue

-- 1. First, let's see the current state
SELECT 'CURRENT CANDIDATES WITH NULL NAMES' as section;

SELECT 
    c.id,
    c.talent_name,
    c.promoter_id,
    c.talent_id,
    c.event_id,
    p.title as event_title,
    pr_promoter.email as promoter_email,
    pr_talent.email as talent_email,
    COALESCE(pr_promoter.full_name, pr_promoter.email) as promoter_name,
    COALESCE(pr_talent.full_name, pr_talent.email) as talent_name
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr_promoter ON c.promoter_id = pr_promoter.id
LEFT JOIN profiles pr_talent ON c.talent_id = pr_talent.id
WHERE c.talent_name IS NULL OR c.talent_name = '' OR c.talent_name = 'Unknown';

-- 2. Update candidates with proper talent names from profiles
UPDATE candidates 
SET 
    talent_name = COALESCE(
        (SELECT full_name FROM profiles WHERE id = candidates.talent_id),
        (SELECT email FROM profiles WHERE id = candidates.talent_id),
        'Unknown Talent'
    ),
    talent_categories = COALESCE(
        candidates.talent_categories,
        (SELECT talent_categories FROM profiles WHERE id = candidates.talent_id),
        ARRAY['Boxer']
    ),
    talent_location = COALESCE(
        candidates.talent_location,
        (SELECT location FROM profiles WHERE id = candidates.talent_id),
        'Unknown Location'
    ),
    talent_image_url = COALESCE(
        candidates.talent_image_url,
        (SELECT profile_image_url FROM profiles WHERE id = candidates.talent_id)
    )
WHERE talent_name IS NULL OR talent_name = '' OR talent_name = 'Unknown';

-- 3. Verify the updates
SELECT 'UPDATED CANDIDATES' as section;

SELECT 
    c.id,
    c.talent_name,
    c.promoter_id,
    c.talent_id,
    c.event_id,
    c.status,
    c.offer_amount,
    p.title as event_title,
    pr_promoter.email as promoter_email,
    pr_talent.email as talent_email,
    COALESCE(pr_promoter.full_name, pr_promoter.email) as promoter_name,
    COALESCE(pr_talent.full_name, pr_talent.email) as talent_name
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr_promoter ON c.promoter_id = pr_promoter.id
LEFT JOIN profiles pr_talent ON c.talent_id = pr_talent.id
ORDER BY c.created_at DESC;

-- 4. Check for any remaining NULL names
SELECT 'REMAINING NULL NAMES' as section;

SELECT 
    c.id,
    c.talent_name,
    c.talent_id,
    pr_talent.email as talent_email,
    pr_talent.full_name as talent_full_name
FROM candidates c
LEFT JOIN profiles pr_talent ON c.talent_id = pr_talent.id
WHERE c.talent_name IS NULL OR c.talent_name = '' OR c.talent_name = 'Unknown';



