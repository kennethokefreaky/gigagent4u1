-- AUDIT MESSAGE BADGE ISSUES
-- This will check why badges aren't showing correctly
-- Run this in your Supabase SQL editor

-- 1. CHECK TALENT'S PARTICIPATION STATUS
SELECT 'TALENT PARTICIPATION STATUS' as section;
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
ORDER BY up.conversation_type, p.full_name;

-- 2. CHECK UNREAD MESSAGES FOR TALENT
SELECT 'UNREAD MESSAGES FOR TALENT' as section;
SELECT 
    p.full_name as talent_name,
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    COUNT(um.id) as unread_count,
    MAX(um.created_at) as latest_message_time
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE p.role = 'talent'
AND um.sender_id != up.user_id  -- Don't count messages sent by talent
AND um.created_at > COALESCE(up.last_read_at, '1970-01-01')
GROUP BY p.full_name, up.conversation_id, up.conversation_type, up.last_read_at
ORDER BY unread_count DESC;

-- 3. CHECK KEITH CAROLS MESSAGES TO TALENT
SELECT 'KEITH CAROLS MESSAGES TO TALENT' as section;
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
    up.last_read_at as receiver_last_read,
    CASE 
        WHEN um.created_at > COALESCE(up.last_read_at, '1970-01-01') THEN 'UNREAD'
        ELSE 'READ'
    END as message_status
FROM unified_messages um
LEFT JOIN profiles sender ON um.sender_id = sender.id
LEFT JOIN unified_participants up ON um.conversation_id = up.conversation_id
LEFT JOIN profiles receiver ON up.user_id = receiver.id
WHERE (sender.email LIKE '%keith%' OR sender.full_name LIKE '%keith%')
AND receiver.role = 'talent'
ORDER BY um.created_at DESC;

-- 4. TOTAL BADGE COUNT FOR TALENT (WHAT HEADER SHOULD SHOW)
SELECT 'TOTAL BADGE COUNT FOR TALENT' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    SUM(unread_counts.unread_count) as total_badge_count
FROM profiles p
LEFT JOIN (
    SELECT 
        up.user_id,
        COUNT(um.id) as unread_count
    FROM unified_participants up
    LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    WHERE um.sender_id != up.user_id  -- Don't count messages sent by the user themselves
    AND um.created_at > COALESCE(up.last_read_at, '1970-01-01')
    GROUP BY up.user_id
) unread_counts ON p.id = unread_counts.user_id
WHERE p.role = 'talent'
GROUP BY p.id, p.full_name, p.email, p.role
ORDER BY total_badge_count DESC;
