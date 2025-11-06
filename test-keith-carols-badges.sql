-- TEST KEITH CAROLS MESSAGE BADGES
-- Now that tables are connected, let's test his badge system
-- Run this in your Supabase SQL editor

-- 1. KEITH CAROLS' PARTICIPATIONS (with profile info)
SELECT 'KEITH CAROLS PARTICIPATIONS' as section;
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
WHERE p.email = 'keithcarols@gmail.com'
ORDER BY up.last_read_at DESC;

-- 2. MESSAGES IN KEITH CAROLS' CONVERSATIONS
SELECT 'MESSAGES IN KEITH CAROLS CONVERSATIONS' as section;
SELECT 
    um.conversation_id,
    um.message_text,
    um.sender_id,
    um.created_at,
    p.full_name as sender_name,
    p.email as sender_email
FROM unified_messages um
LEFT JOIN profiles p ON um.sender_id = p.id
WHERE um.conversation_id IN (
    SELECT conversation_id 
    FROM unified_participants 
    WHERE user_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com')
)
ORDER BY um.created_at DESC
LIMIT 10;

-- 3. UNREAD MESSAGES FOR KEITH CAROLS
SELECT 'UNREAD MESSAGES FOR KEITH CAROLS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    COUNT(um.id) as unread_count
FROM unified_participants up
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id  -- Don't count own messages
WHERE up.user_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com')
GROUP BY up.conversation_id, up.conversation_type, up.last_read_at
HAVING COUNT(um.id) > 0
ORDER BY unread_count DESC;

-- 4. TOTAL BADGE COUNT FOR KEITH CAROLS
SELECT 'TOTAL BADGE COUNT FOR KEITH CAROLS' as section;
SELECT 
    COUNT(*) as total_unread_messages
FROM unified_participants up
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id  -- Don't count own messages
WHERE up.user_id = (SELECT id FROM profiles WHERE email = 'keithcarols@gmail.com');
