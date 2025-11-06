-- AUDIT GROUP MESSAGE BADGES COMPLETE
-- Check why group message badges aren't showing
-- Run this in your Supabase SQL editor

-- 1. KEITH CAROLS' GROUP MESSAGES
SELECT 'KEITH CAROLS GROUP MESSAGES' as section;
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

-- 2. GROUP CONVERSATIONS WITH KEITH CAROLS
SELECT 'GROUP CONVERSATIONS WITH KEITH CAROLS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE up.conversation_id LIKE 'group_%'
    AND up.user_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com');

-- 3. TALENT PARTICIPATIONS IN KEITH CAROLS' GROUP CHATS
SELECT 'TALENT PARTICIPATIONS IN KEITH CAROLS GROUP CHATS' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    p.full_name,
    p.email,
    p.role,
    up.last_read_at
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE up.conversation_id IN (
    SELECT conversation_id 
    FROM unified_participants 
    WHERE user_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com')
    AND conversation_id LIKE 'group_%'
)
AND p.role = 'talent'
ORDER BY up.conversation_id, up.last_read_at;

-- 4. UNREAD GROUP MESSAGES FOR TALENTS
SELECT 'UNREAD GROUP MESSAGES FOR TALENTS' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    p.full_name,
    p.email,
    up.last_read_at,
    COUNT(um.id) as unread_count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id  -- Don't count own messages
WHERE up.conversation_id LIKE 'group_%'
    AND p.role = 'talent'
GROUP BY up.conversation_id, up.user_id, p.full_name, p.email, up.last_read_at
HAVING COUNT(um.id) > 0
ORDER BY unread_count DESC;

-- 5. TOTAL BADGE COUNT FOR ALL TALENTS
SELECT 'TOTAL BADGE COUNT FOR ALL TALENTS' as section;
SELECT 
    p.full_name,
    p.email,
    COUNT(*) as total_unread_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id  -- Don't count own messages
WHERE p.role = 'talent'
GROUP BY p.full_name, p.email
HAVING COUNT(*) > 0
ORDER BY total_unread_messages DESC;
