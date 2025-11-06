-- SHOW INDIVIDUAL USER BREAKDOWN
-- This will show each user's individual badge counts
-- Run this in your Supabase SQL editor

-- 1. ALL USERS WITH PARTICIPATIONS (INDIVIDUAL)
SELECT 'ALL USERS WITH PARTICIPATIONS (INDIVIDUAL)' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    COUNT(up.conversation_id) as total_conversations,
    COALESCE(SUM(
        CASE 
            WHEN um.created_at > up.last_read_at 
            AND um.sender_id != up.user_id 
            THEN 1 
            ELSE 0 
        END
    ), 0) as total_unread_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
GROUP BY p.full_name, p.email, p.role
ORDER BY p.role, total_unread_messages DESC;

-- 2. ALL PARTICIPANTS WITH CONVERSATION DETAILS
SELECT 'ALL PARTICIPANTS WITH CONVERSATION DETAILS' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    COALESCE(COUNT(
        CASE 
            WHEN um.created_at > up.last_read_at 
            AND um.sender_id != up.user_id 
            THEN 1 
        END
    ), 0) as unread_count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
GROUP BY p.full_name, p.email, p.role, up.conversation_id, up.conversation_type, up.last_read_at
ORDER BY p.role, unread_count DESC;

-- 3. GROUP MESSAGE PARTICIPANTS (INDIVIDUAL)
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

-- 4. PRIVATE MESSAGE PARTICIPANTS (INDIVIDUAL)
SELECT 'PRIVATE MESSAGE PARTICIPANTS (INDIVIDUAL)' as section;
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
    ), 0) as unread_private_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE up.conversation_id LIKE 'private_%'
GROUP BY p.full_name, p.email, p.role, up.conversation_id, up.last_read_at
ORDER BY p.role, unread_private_messages DESC;
