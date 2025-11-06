-- FIX PROMOTER PARTICIPATION IN GROUP CHATS (CORRECTED)
-- This ensures promoters are automatically added as participants
-- Run this in your Supabase SQL editor

-- 1. FIRST, LET'S CHECK THE POSTS TABLE STRUCTURE
SELECT 'POSTS TABLE COLUMNS' as section;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. CHECK EXISTING GROUP CHATS (WITH CORRECT COLUMN)
SELECT 'EXISTING GROUP CHATS' as section;
SELECT DISTINCT 
    mp.event_id, 
    p.title as event_title,
    p.created_by as promoter_id
FROM message_participants mp
JOIN posts p ON mp.event_id = p.id
ORDER BY p.created_at DESC;

-- 3. ADD KEITH CAROLS TO ALL GROUP CHATS WHERE HE'S THE PROMOTER
INSERT INTO message_participants (event_id, user_id, joined_at)
SELECT DISTINCT 
    p.id as event_id,
    p.created_by as promoter_id,
    NOW() as joined_at
FROM posts p
WHERE p.created_by = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
AND p.id NOT IN (
    SELECT event_id FROM message_participants 
    WHERE user_id = p.created_by
)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- 4. VERIFY KEITH CAROLS IS NOW A PARTICIPANT
SELECT 'KEITH CAROLS PARTICIPATION STATUS' as section;
SELECT mp.event_id, p.title, mp.user_id, mp.joined_at
FROM message_participants mp
JOIN posts p ON mp.event_id = p.id
WHERE mp.user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1);
