-- DEBUG GROUP MESSAGES IN UNIFIED SYSTEM
-- Check if group messages are properly stored in unified_messages table

-- 1. CHECK IF GROUP MESSAGES EXIST IN unified_messages
SELECT 'GROUP MESSAGES IN unified_messages' as section;
SELECT 
    um.id,
    um.conversation_id,
    um.sender_id,
    p.email as sender_email,
    um.message_text,
    um.created_at,
    up.conversation_type
FROM unified_messages um
JOIN unified_participants up ON um.conversation_id = up.conversation_id
JOIN profiles p ON um.sender_id = p.id
WHERE up.conversation_type = 'group'
ORDER BY um.created_at DESC
LIMIT 10;

-- 2. CHECK PARTICIPANTS FOR GROUP CONVERSATIONS
SELECT 'GROUP PARTICIPANTS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    p.email,
    up.last_read_at
FROM unified_participants up
JOIN profiles p ON up.user_id = p.id
WHERE up.conversation_type = 'group'
ORDER BY up.conversation_id, up.user_id;

-- 3. CHECK SPECIFIC CONVERSATION FOR "need a wrestler"
SELECT 'NEED A WRESTLER CONVERSATION' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    p.email,
    up.last_read_at,
    um.message_text,
    um.created_at
FROM unified_participants up
JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE up.conversation_type = 'group'
  AND p.email = 'ronaldpower@gmail.com'
ORDER BY um.created_at DESC;

-- 4. CHECK IF KEITH CAROLS MESSAGES ARE IN UNIFIED SYSTEM
SELECT 'KEITH CAROLS MESSAGES' as section;
SELECT 
    um.id,
    um.conversation_id,
    um.sender_id,
    p.email as sender_email,
    um.message_text,
    um.created_at
FROM unified_messages um
JOIN profiles p ON um.sender_id = p.id
WHERE p.email = 'keithcarols@gmail.com'
ORDER BY um.created_at DESC;
