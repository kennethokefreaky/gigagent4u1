-- RESET GROUP READ TIMESTAMPS
-- Reset last_read_at for group conversations so messages appear as unread

-- 1. RESET GROUP CONVERSATION READ TIMESTAMPS
UPDATE unified_participants 
SET last_read_at = '2025-09-29T00:00:00.000+00:00'  -- Set to yesterday
WHERE conversation_type = 'group'
  AND user_id IN (
    SELECT id FROM profiles WHERE email = 'ronaldpower@gmail.com'
  );

-- 2. VERIFY THE UPDATE
SELECT 'UPDATED GROUP PARTICIPANTS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    p.email,
    up.last_read_at
FROM unified_participants up
JOIN profiles p ON up.user_id = p.id
WHERE up.conversation_type = 'group'
  AND p.email = 'ronaldpower@gmail.com'
ORDER BY up.conversation_id;

-- 3. CHECK LATEST GROUP MESSAGES
SELECT 'LATEST GROUP MESSAGES' as section;
SELECT 
    um.conversation_id,
    um.sender_id,
    p.email as sender_email,
    um.message_text,
    um.created_at
FROM unified_messages um
JOIN profiles p ON um.sender_id = p.id
WHERE um.conversation_id LIKE 'group_%'
  AND p.email = 'keithcarols@gmail.com'
ORDER BY um.created_at DESC
LIMIT 5;
