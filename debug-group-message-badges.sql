-- DEBUG GROUP MESSAGE BADGES
-- This will check why group messages aren't showing badges
-- Run this in your Supabase SQL editor

-- 1. CHECK TALENT'S PARTICIPATION IN GROUP CHATS
SELECT 'TALENT PARTICIPATION IN GROUP CHATS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email,
    p.role
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE p.role = 'talent'
AND up.conversation_type = 'group'
ORDER BY p.full_name;

-- 2. CHECK RECENT GROUP MESSAGES FOR TALENTS
SELECT 'RECENT GROUP MESSAGES FOR TALENTS' as section;
SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    sender.full_name as sender_name,
    sender.role as sender_role,
    receiver.full_name as receiver_name,
    receiver.role as receiver_role,
    up.last_read_at as receiver_last_read
FROM unified_messages um
LEFT JOIN profiles sender ON um.sender_id = sender.id
LEFT JOIN unified_participants up ON um.conversation_id = up.conversation_id
LEFT JOIN profiles receiver ON up.user_id = receiver.id
WHERE um.conversation_type = 'group'
AND receiver.role = 'talent'
AND um.sender_id != up.user_id  -- Messages sent TO talent, not BY talent
ORDER BY um.created_at DESC
LIMIT 10;

-- 3. CHECK UNREAD GROUP MESSAGES FOR TALENTS
SELECT 'UNREAD GROUP MESSAGES FOR TALENTS' as section;
SELECT 
    receiver.full_name as talent_name,
    receiver.email as talent_email,
    um.conversation_id,
    um.message_text,
    um.created_at,
    up.last_read_at,
    CASE 
        WHEN um.created_at > COALESCE(up.last_read_at, '1970-01-01') THEN 'UNREAD'
        ELSE 'READ'
    END as message_status
FROM unified_messages um
LEFT JOIN unified_participants up ON um.conversation_id = up.conversation_id
LEFT JOIN profiles receiver ON up.user_id = receiver.id
WHERE um.conversation_type = 'group'
AND receiver.role = 'talent'
AND um.sender_id != up.user_id  -- Messages sent TO talent, not BY talent
ORDER BY um.created_at DESC;

-- 4. CHECK KEITH CAROLS GROUP MESSAGES
SELECT 'KEITH CAROLS GROUP MESSAGES' as section;
SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    sender.full_name as sender_name,
    sender.role as sender_role
FROM unified_messages um
LEFT JOIN profiles sender ON um.sender_id = sender.id
WHERE um.conversation_type = 'group'
AND (sender.email LIKE '%keith%' OR sender.full_name LIKE '%keith%')
ORDER BY um.created_at DESC
LIMIT 5;
