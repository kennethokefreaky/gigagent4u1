-- AUDIT KEITH CAROLS SPECIFICALLY
-- This will check Keith Carols' participation and message status
-- Run this in your Supabase SQL editor

-- 1. FIND KEITH CAROLS' PROFILE
SELECT 'KEITH CAROLS PROFILE' as section;
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE email LIKE '%keith%' OR full_name LIKE '%keith%'
ORDER BY created_at DESC;

-- 2. CHECK KEITH CAROLS' PARTICIPATION IN CONVERSATIONS
SELECT 'KEITH CAROLS PARTICIPATION' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE p.email LIKE '%keith%' OR p.full_name LIKE '%keith%'
ORDER BY up.conversation_type;

-- 3. CHECK MESSAGES IN KEITH CAROLS' CONVERSATIONS
SELECT 'MESSAGES IN KEITH CAROLS CONVERSATIONS' as section;
SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    sender.full_name as sender_name,
    sender.email as sender_email,
    sender.role as sender_role
FROM unified_messages um
LEFT JOIN profiles sender ON um.sender_id = sender.id
WHERE um.conversation_id IN (
    SELECT conversation_id FROM unified_participants up
    LEFT JOIN profiles p ON up.user_id = p.id
    WHERE p.email LIKE '%keith%' OR p.full_name LIKE '%keith%'
)
ORDER BY um.created_at DESC
LIMIT 10;

-- 4. CHECK UNREAD MESSAGES FOR KEITH CAROLS
SELECT 'UNREAD MESSAGES FOR KEITH CAROLS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    COUNT(um.id) as unread_count,
    MAX(um.created_at) as latest_message_time
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE (p.email LIKE '%keith%' OR p.full_name LIKE '%keith%')
AND um.sender_id != up.user_id  -- Don't count messages sent by Keith Carols
AND um.created_at > COALESCE(up.last_read_at, '1970-01-01')
GROUP BY up.conversation_id, up.conversation_type, up.last_read_at
ORDER BY unread_count DESC;

-- 5. CHECK IF KEITH CAROLS HAS ANY PARTICIPATION AT ALL
SELECT 'KEITH CAROLS PARTICIPATION CHECK' as section;
SELECT 
    'Total participants for Keith Carols' as check_type,
    COUNT(*) as count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE p.email LIKE '%keith%' OR p.full_name LIKE '%keith%';
