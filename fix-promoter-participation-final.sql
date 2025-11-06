-- FIX PROMOTER PARTICIPATION IN GROUP CHATS (FINAL)
-- This ensures promoters are automatically added as participants
-- Run this in your Supabase SQL editor

-- 1. CHECK EXISTING GROUP CHATS
SELECT 'EXISTING GROUP CHATS' as section;
SELECT DISTINCT 
    mp.event_id, 
    p.title as event_title,
    p.promoter_id,
    p.created_at
FROM message_participants mp
JOIN posts p ON mp.event_id = p.id
ORDER BY p.created_at DESC;

-- 2. ADD KEITH CAROLS TO ALL GROUP CHATS WHERE HE'S THE PROMOTER
INSERT INTO message_participants (event_id, user_id, joined_at)
SELECT DISTINCT 
    p.id as event_id,
    p.promoter_id as promoter_id,
    NOW() as joined_at
FROM posts p
WHERE p.promoter_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
AND p.id NOT IN (
    SELECT event_id FROM message_participants 
    WHERE user_id = p.promoter_id
)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- 3. VERIFY KEITH CAROLS IS NOW A PARTICIPANT
SELECT 'KEITH CAROLS PARTICIPATION STATUS' as section;
SELECT mp.event_id, p.title, mp.user_id, mp.joined_at
FROM message_participants mp
JOIN posts p ON mp.event_id = p.id
WHERE mp.user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1);

-- 4. CHECK RECENT MESSAGES KEITH SHOULD NOW SEE
SELECT 'MESSAGES KEITH SHOULD NOW SEE' as section;
SELECT m.id, m.event_id, m.sender_id, m.message_text, m.created_at
FROM messages m
JOIN message_participants mp ON m.event_id = mp.event_id
WHERE mp.user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
ORDER BY m.created_at DESC
LIMIT 5;
