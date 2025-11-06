-- AUDIT MESSAGE BADGE SYSTEM
-- This will check if the message badge system is working correctly
-- Run this in your Supabase SQL editor

-- 1. CHECK UNIFIED PARTICIPANTS FOR KEITH CAROLS
SELECT 'KEITH CAROLS PARTICIPANTS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE up.user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1);

-- 2. CHECK UNIFIED MESSAGES FOR KEITH CAROLS CONVERSATIONS
SELECT 'UNIFIED MESSAGES FOR KEITH CAROLS' as section;
SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    p.full_name as sender_name,
    p.email as sender_email
FROM unified_messages um
LEFT JOIN profiles p ON um.sender_id = p.id
WHERE um.conversation_id IN (
    SELECT conversation_id FROM unified_participants 
    WHERE user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
)
ORDER BY um.created_at DESC
LIMIT 10;

-- 3. CHECK UNREAD MESSAGE COUNT FOR KEITH CAROLS
SELECT 'UNREAD MESSAGE COUNT FOR KEITH CAROLS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    COUNT(um.id) as unread_count
FROM unified_participants up
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE up.user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
AND um.sender_id != up.user_id  -- Don't count messages sent by Keith Carols
AND um.created_at > COALESCE(up.last_read_at, '1970-01-01')
GROUP BY up.conversation_id, up.conversation_type, up.last_read_at
ORDER BY unread_count DESC;

-- 4. TOTAL UNREAD COUNT FOR KEITH CAROLS
SELECT 'TOTAL UNREAD COUNT FOR KEITH CAROLS' as section;
SELECT 
    COUNT(um.id) as total_unread_count
FROM unified_participants up
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE up.user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
AND um.sender_id != up.user_id  -- Don't count messages sent by Keith Carols
AND um.created_at > COALESCE(up.last_read_at, '1970-01-01');
