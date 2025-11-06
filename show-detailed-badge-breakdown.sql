-- SHOW DETAILED BADGE BREAKDOWN
-- This will show exactly which users have badges and how many
-- Run this in your Supabase SQL editor

-- 1. ALL USERS WITH PARTICIPATIONS
SELECT 'ALL USERS WITH PARTICIPATIONS' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    COUNT(up.conversation_id) as total_conversations
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
GROUP BY p.full_name, p.email, p.role
ORDER BY p.role, total_conversations DESC;

-- 2. UNREAD MESSAGES FOR ALL USERS
SELECT 'UNREAD MESSAGES FOR ALL USERS' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    COUNT(um.id) as unread_count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id  -- Don't count own messages
GROUP BY p.full_name, p.email, p.role, up.conversation_id, up.conversation_type, up.last_read_at
HAVING COUNT(um.id) > 0
ORDER BY p.role, unread_count DESC;

-- 3. TOTAL BADGE COUNT FOR EACH USER
SELECT 'TOTAL BADGE COUNT FOR EACH USER' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    COUNT(*) as total_unread_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id  -- Don't count own messages
GROUP BY p.full_name, p.email, p.role
HAVING COUNT(*) > 0
ORDER BY p.role, total_unread_messages DESC;

-- 4. GROUP MESSAGE BADGES SPECIFICALLY
SELECT 'GROUP MESSAGE BADGES SPECIFICALLY' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    up.conversation_id,
    up.last_read_at,
    COUNT(um.id) as unread_group_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id  -- Don't count own messages
WHERE up.conversation_id LIKE 'group_%'
GROUP BY p.full_name, p.email, p.role, up.conversation_id, up.last_read_at
HAVING COUNT(um.id) > 0
ORDER BY p.role, unread_group_messages DESC;

-- 5. PRIVATE MESSAGE BADGES SPECIFICALLY
SELECT 'PRIVATE MESSAGE BADGES SPECIFICALLY' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    up.conversation_id,
    up.last_read_at,
    COUNT(um.id) as unread_private_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id  -- Don't count own messages
WHERE up.conversation_id LIKE 'private_%'
GROUP BY p.full_name, p.email, p.role, up.conversation_id, up.last_read_at
HAVING COUNT(um.id) > 0
ORDER BY p.role, unread_private_messages DESC;
