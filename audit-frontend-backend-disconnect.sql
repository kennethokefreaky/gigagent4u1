-- AUDIT FRONTEND-BACKEND DISCONNECT
-- Check if the migrated data is properly connected to the frontend
-- Run this in your Supabase SQL editor

-- 1. CHECK TALENT USER'S UNIFIED PARTICIPATIONS
SELECT 'TALENT USER UNIFIED PARTICIPATIONS' as section;
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
ORDER BY p.email, up.last_read_at DESC;

-- 2. CHECK TALENT USER'S UNREAD MESSAGES
SELECT 'TALENT USER UNREAD MESSAGES' as section;
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
WHERE p.role = 'talent'
GROUP BY up.conversation_id, up.user_id, p.full_name, p.email, p.role, up.last_read_at
HAVING COUNT(um.id) > 0
ORDER BY p.email, unread_count DESC;

-- 3. CHECK KEITH CAROLS' GROUP MESSAGES TO TALENTS
SELECT 'KEITH CAROLS GROUP MESSAGES TO TALENTS' as section;
SELECT 
    um.conversation_id,
    um.message_text,
    um.sender_id,
    um.created_at,
    p.full_name as sender_name,
    p.email as sender_email
FROM unified_messages um
LEFT JOIN profiles p ON um.sender_id = p.id
WHERE um.conversation_type = 'group'
    AND um.sender_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com')
ORDER BY um.created_at DESC
LIMIT 10;

-- 4. CHECK TALENT PARTICIPATION IN KEITH CAROLS' GROUP CHATS
SELECT 'TALENT PARTICIPATION IN KEITH CAROLS GROUP CHATS' as section;
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
WHERE up.conversation_id IN (
    SELECT conversation_id 
    FROM unified_participants 
    WHERE user_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com')
    AND conversation_type = 'group'
)
AND p.role = 'talent'
GROUP BY up.conversation_id, up.user_id, p.full_name, p.email, p.role, up.last_read_at
ORDER BY p.email, unread_count DESC;

-- 5. TOTAL BADGE COUNT FOR TALENTS
SELECT 'TOTAL BADGE COUNT FOR TALENTS' as section;
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
    ) as total_unread_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE p.role = 'talent'
GROUP BY p.full_name, p.email, p.role
HAVING SUM(
    CASE 
        WHEN um.created_at > up.last_read_at 
        AND um.sender_id != up.user_id 
        THEN 1 
        ELSE 0 
    END
) > 0
ORDER BY total_unread_messages DESC;
