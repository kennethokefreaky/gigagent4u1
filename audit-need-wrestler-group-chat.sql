-- AUDIT "NEED A WRESTLER" GROUP CHAT
-- Check why this specific group chat isn't showing badges
-- Run this in your Supabase SQL editor

-- 1. FIND THE "NEED A WRESTLER" GROUP CHAT
SELECT 'FIND NEED A WRESTLER GROUP CHAT' as section;
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
WHERE up.conversation_id LIKE 'group_%'
ORDER BY up.conversation_id;

-- 2. MESSAGES IN "NEED A WRESTLER" GROUP CHAT
SELECT 'MESSAGES IN NEED A WRESTLER GROUP CHAT' as section;
SELECT 
    um.conversation_id,
    um.message_text,
    um.sender_id,
    um.created_at,
    p.full_name as sender_name,
    p.email as sender_email,
    p.role as sender_role
FROM unified_messages um
LEFT JOIN profiles p ON um.sender_id = p.id
WHERE um.conversation_id LIKE 'group_%'
ORDER BY um.created_at DESC
LIMIT 10;

-- 3. KEITH CAROLS' MESSAGES IN GROUP CHATS
SELECT 'KEITH CAROLS MESSAGES IN GROUP CHATS' as section;
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

-- 4. PARTICIPANTS IN GROUP CHATS
SELECT 'PARTICIPANTS IN GROUP CHATS' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    p.full_name,
    p.email,
    p.role,
    up.last_read_at,
    COUNT(um.id) as unread_count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id
WHERE up.conversation_id LIKE 'group_%'
GROUP BY up.conversation_id, up.user_id, p.full_name, p.email, p.role, up.last_read_at
ORDER BY up.conversation_id, unread_count DESC;

-- 5. CHECK IF KEITH CAROLS IS IN GROUP CHATS
SELECT 'KEITH CAROLS PARTICIPATION IN GROUP CHATS' as section;
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
    AND p.email = 'keithcarols@gmail.com'
ORDER BY up.conversation_id;
