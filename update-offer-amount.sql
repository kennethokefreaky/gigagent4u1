-- Update offer amount for existing candidate
-- This script helps update the offer amount for ronaldpower in the "need a wrestler" event

-- 1. First, let's see the current candidate data
SELECT 'CURRENT CANDIDATES' as section;

SELECT 
    c.id,
    c.promoter_id,
    c.talent_id,
    c.event_id,
    c.status,
    c.offer_amount,
    c.created_at,
    p.title as event_title,
    COALESCE(pr.full_name, pr.email) as promoter_name,
    COALESCE(pr_talent.full_name, pr_talent.email) as talent_name,
    pr.email as promoter_email,
    pr_talent.email as talent_email
FROM candidates c
JOIN posts p ON c.event_id = p.id
JOIN profiles pr ON c.promoter_id = pr.id
JOIN profiles pr_talent ON c.talent_id = pr_talent.id
WHERE (pr.email LIKE '%keith%' OR COALESCE(pr.full_name, pr.email) LIKE '%keith%')
   OR (pr_talent.email LIKE '%ronald%' OR COALESCE(pr_talent.full_name, pr_talent.email) LIKE '%ronald%')
   OR p.title LIKE '%wrestler%'
ORDER BY c.created_at DESC;

-- 2. Update the offer amount (replace with actual amount you want)
-- Example: Update to $2500
UPDATE candidates 
SET offer_amount = 2500
WHERE talent_id = (
    SELECT id FROM profiles WHERE email LIKE '%ronald%'
)
AND event_id = (
    SELECT id FROM posts WHERE title LIKE '%wrestler%'
)
AND status = 'pending';

-- 3. Verify the update
SELECT 'UPDATED CANDIDATES' as section;

SELECT 
    c.id,
    c.promoter_id,
    c.talent_id,
    c.event_id,
    c.status,
    c.offer_amount,
    c.created_at,
    p.title as event_title,
    COALESCE(pr.full_name, pr.email) as promoter_name,
    COALESCE(pr_talent.full_name, pr_talent.email) as talent_name,
    pr.email as promoter_email,
    pr_talent.email as talent_email
FROM candidates c
JOIN posts p ON c.event_id = p.id
JOIN profiles pr ON c.promoter_id = pr.id
JOIN profiles pr_talent ON c.talent_id = pr_talent.id
WHERE (pr.email LIKE '%keith%' OR COALESCE(pr.full_name, pr.email) LIKE '%keith%')
   OR (pr_talent.email LIKE '%ronald%' OR COALESCE(pr_talent.full_name, pr_talent.email) LIKE '%ronald%')
   OR p.title LIKE '%wrestler%'
ORDER BY c.created_at DESC;

-- 4. Check for any notifications that might need updating
SELECT 'NOTIFICATIONS' as section;

SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.offer_amount,
    n.event_name,
    n.created_at,
    pr.full_name as recipient_name
FROM notifications n
JOIN profiles pr ON n.user_id = pr.id
WHERE pr.email LIKE '%ronald%'
   OR n.message LIKE '%wrestler%'
   OR n.offer_amount IS NOT NULL
ORDER BY n.created_at DESC;
