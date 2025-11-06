-- DEBUG LAST READ TIMESTAMP
-- Check why talent's last_read_at is being updated
-- Run this in your Supabase SQL editor

-- 1. CHECK TALENT'S PARTICIPATION IN GROUP CHAT
SELECT 'TALENT PARTICIPATION IN GROUP CHAT' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email,
    p.role
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE up.conversation_id LIKE 'group_%'
    AND p.role = 'talent'
ORDER BY up.last_read_at DESC;

-- 2. CHECK KEITH CAROLS' RECENT MESSAGES
SELECT 'KEITH CAROLS RECENT MESSAGES' as section;
SELECT 
    um.conversation_id,
    um.message_text,
    um.sender_id,
    um.created_at,
    p.full_name as sender_name,
    p.email as sender_email
FROM unified_messages um
LEFT JOIN profiles p ON um.sender_id = p.id
WHERE um.sender_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com')
    AND um.conversation_type = 'group'
ORDER BY um.created_at DESC
LIMIT 5;

-- 3. CHECK UNREAD MESSAGES FOR TALENT
SELECT 'UNREAD MESSAGES FOR TALENT' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email,
    COUNT(um.id) as unread_count,
    MAX(um.created_at) as latest_message_time
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id
WHERE p.role = 'talent'
GROUP BY up.conversation_id, up.user_id, up.last_read_at, p.full_name, p.email
ORDER BY p.email, unread_count DESC;

-- 4. CHECK IF TALENT'S LAST_READ_AT IS TOO RECENT
SELECT 'TALENT LAST READ AT CHECK' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email,
    MAX(um.created_at) as latest_message_time,
    CASE 
        WHEN up.last_read_at >= MAX(um.created_at) 
        THEN 'READ (last_read_at >= latest_message)'
        ELSE 'UNREAD (last_read_at < latest_message)'
    END as read_status
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE p.role = 'talent'
    AND up.conversation_type = 'group'
GROUP BY up.conversation_id, up.user_id, up.last_read_at, p.full_name, p.email
ORDER BY p.email, up.last_read_at DESC;
