-- SHOW GROUP CHAT MESSAGES ONLY
-- This will show only group chat participants and their badges
-- Run this in your Supabase SQL editor

-- 1. GROUP MESSAGE PARTICIPANTS (INDIVIDUAL)
SELECT 'GROUP MESSAGE PARTICIPANTS (INDIVIDUAL)' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    up.conversation_id,
    up.last_read_at,
    COALESCE(COUNT(
        CASE 
            WHEN um.created_at > up.last_read_at 
            AND um.sender_id != up.user_id 
            THEN 1 
        END
    ), 0) as unread_group_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE up.conversation_id LIKE 'group_%'
GROUP BY p.full_name, p.email, p.role, up.conversation_id, up.last_read_at
ORDER BY p.role, unread_group_messages DESC;

-- 2. GROUP MESSAGES SENT BY KEITH CAROLS
SELECT 'GROUP MESSAGES SENT BY KEITH CAROLS' as section;
SELECT 
    um.conversation_id,
    um.message_text,
    um.sender_id,
    um.created_at,
    p.full_name as sender_name,
    p.email as sender_email
FROM unified_messages um
LEFT JOIN profiles p ON um.sender_id = p.id
WHERE um.conversation_id LIKE 'group_%'
    AND um.sender_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com')
ORDER BY um.created_at DESC;

-- 3. ALL GROUP CONVERSATIONS
SELECT 'ALL GROUP CONVERSATIONS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    COUNT(up.user_id) as participant_count,
    MAX(um.created_at) as last_message_time
FROM unified_participants up
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE up.conversation_id LIKE 'group_%'
GROUP BY up.conversation_id, up.conversation_type
ORDER BY last_message_time DESC;

-- 4. GROUP MESSAGE BADGES BY USER
SELECT 'GROUP MESSAGE BADGES BY USER' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    SUM(
        CASE 
            WHEN um.created_at > up.last_read_at 
            AND um.sender_id != up.user_id 
            THEN 1 
            ELSE 0 
        END
    ) as total_group_badges
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE up.conversation_id LIKE 'group_%'
GROUP BY p.full_name, p.email, p.role
ORDER BY p.role, total_group_badges DESC;
