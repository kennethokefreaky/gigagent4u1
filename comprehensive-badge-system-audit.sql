-- COMPREHENSIVE MESSAGE BADGE SYSTEM AUDIT
-- Test badge system for both promoters and talents
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

-- 2. RECENT MESSAGES (LAST 24 HOURS)
SELECT 'RECENT MESSAGES (LAST 24 HOURS)' as section;
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
WHERE um.created_at > NOW() - INTERVAL '24 hours'
ORDER BY um.created_at DESC
LIMIT 20;

-- 3. UNREAD MESSAGES FOR ALL USERS
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

-- 4. TOTAL BADGE COUNT FOR EACH USER
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

-- 5. GROUP MESSAGE BADGES SPECIFICALLY
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

-- 6. PRIVATE MESSAGE BADGES SPECIFICALLY
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

-- 7. BADGE SYSTEM SUMMARY
SELECT 'BADGE SYSTEM SUMMARY' as section;
SELECT 
    'Total Users' as metric,
    COUNT(DISTINCT p.id) as count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
UNION ALL
SELECT 
    'Users with Unread Messages' as metric,
    COUNT(DISTINCT p.id) as count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id
UNION ALL
SELECT 
    'Total Unread Messages' as metric,
    COUNT(*) as count
FROM unified_participants up
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id;
