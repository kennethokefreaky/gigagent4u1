-- CHECK MESSAGES IN BOTH SYSTEMS
-- This will show us where the messages are stored
-- Run this in your Supabase SQL editor

-- 1. CHECK MESSAGES IN OLD SYSTEM (messages table)
SELECT 'OLD SYSTEM - messages table' as system, COUNT(*) as message_count
FROM messages 
WHERE event_id IN (
  SELECT DISTINCT event_id FROM message_participants 
  WHERE user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
);

-- 2. CHECK MESSAGES IN NEW SYSTEM (unified_messages table)
SELECT 'NEW SYSTEM - unified_messages table' as system, COUNT(*) as message_count
FROM unified_messages 
WHERE conversation_id LIKE 'group_%'
AND conversation_id IN (
  SELECT DISTINCT conversation_id FROM unified_participants 
  WHERE user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
);

-- 3. CHECK PARTICIPANTS IN BOTH SYSTEMS
SELECT 'OLD SYSTEM - message_participants' as system, COUNT(*) as participant_count
FROM message_participants 
WHERE user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)

UNION ALL

SELECT 'NEW SYSTEM - unified_participants' as system, COUNT(*) as participant_count
FROM unified_participants 
WHERE user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1);

-- 4. SHOW SAMPLE MESSAGES FROM BOTH SYSTEMS
SELECT 'SAMPLE MESSAGES - OLD SYSTEM' as section;
SELECT id, event_id, sender_id, message_text, created_at
FROM messages 
WHERE event_id IN (
  SELECT DISTINCT event_id FROM message_participants 
  WHERE user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
)
ORDER BY created_at DESC
LIMIT 3;

SELECT 'SAMPLE MESSAGES - NEW SYSTEM' as section;
SELECT id, conversation_id, sender_id, message_text, created_at
FROM unified_messages 
WHERE conversation_id LIKE 'group_%'
AND conversation_id IN (
  SELECT DISTINCT conversation_id FROM unified_participants 
  WHERE user_id = (SELECT id FROM profiles WHERE email LIKE '%keith%' OR full_name LIKE '%keith%' LIMIT 1)
)
ORDER BY created_at DESC
LIMIT 3;
