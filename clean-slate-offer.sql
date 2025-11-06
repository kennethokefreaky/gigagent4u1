-- Clean slate approach: Remove existing candidate and start fresh
-- This removes ronaldpower from the "need a wrestler" event so keith can invite again

-- 1. First, let's see what we're about to delete
SELECT 'CANDIDATES TO DELETE' as section;

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
   AND (pr_talent.email LIKE '%ronald%' OR COALESCE(pr_talent.full_name, pr_talent.email) LIKE '%ronald%')
   AND p.title LIKE '%wrestler%';

-- 2. Delete the existing candidate record
DELETE FROM candidates 
WHERE talent_id = (
    SELECT id FROM profiles WHERE email LIKE '%ronald%'
)
AND event_id = (
    SELECT id FROM posts WHERE title LIKE '%wrestler%'
)
AND promoter_id = (
    SELECT id FROM profiles WHERE email LIKE '%keith%'
);

-- 3. Delete any related notifications
DELETE FROM notifications 
WHERE user_id = (
    SELECT id FROM profiles WHERE email LIKE '%ronald%'
)
AND (message LIKE '%wrestler%' OR message LIKE '%offer%');

-- 4. Verify the cleanup
SELECT 'REMAINING CANDIDATES' as section;

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
   OR p.title LIKE '%wrestler%'
ORDER BY c.created_at DESC;

-- 5. Check remaining notifications
SELECT 'REMAINING NOTIFICATIONS' as section;

SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.offer_amount,
    n.created_at,
    pr.full_name as recipient_name
FROM notifications n
JOIN profiles pr ON n.user_id = pr.id
WHERE pr.email LIKE '%ronald%'
   OR n.message LIKE '%wrestler%'
ORDER BY n.created_at DESC;
