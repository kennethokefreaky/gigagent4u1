-- MIGRATE GROUP MESSAGES FROM OLD TO NEW SYSTEM
-- This will move all group chat messages from 'messages' to 'unified_messages'
-- Run this in your Supabase SQL editor

-- 1. MIGRATE MESSAGES FROM OLD SYSTEM TO NEW SYSTEM
INSERT INTO unified_messages (
  conversation_id,
  conversation_type,
  sender_id,
  message_text,
  created_at,
  updated_at
)
SELECT 
  'group_' || m.event_id as conversation_id,
  'group' as conversation_type,
  m.sender_id,
  m.message_text,
  m.created_at,
  m.updated_at
FROM messages m
WHERE NOT EXISTS (
  SELECT 1 FROM unified_messages um 
  WHERE um.conversation_id = 'group_' || m.event_id
  AND um.sender_id = m.sender_id
  AND um.message_text = m.message_text
  AND um.created_at = m.created_at
);

-- 2. MIGRATE PARTICIPANTS FROM OLD SYSTEM TO NEW SYSTEM
INSERT INTO unified_participants (
  conversation_id,
  conversation_type,
  user_id
)
SELECT DISTINCT
  'group_' || mp.event_id as conversation_id,
  'group' as conversation_type,
  mp.user_id
FROM message_participants mp
WHERE NOT EXISTS (
  SELECT 1 FROM unified_participants up 
  WHERE up.conversation_id = 'group_' || mp.event_id
  AND up.user_id = mp.user_id
);

-- 3. VERIFY MIGRATION RESULTS
SELECT 'MIGRATION RESULTS' as section;

SELECT 'OLD SYSTEM - messages table' as system, COUNT(*) as message_count
FROM messages;

SELECT 'NEW SYSTEM - unified_messages table' as system, COUNT(*) as message_count
FROM unified_messages 
WHERE conversation_type = 'group';

SELECT 'OLD SYSTEM - message_participants table' as system, COUNT(*) as participant_count
FROM message_participants;

SELECT 'NEW SYSTEM - unified_participants table' as system, COUNT(*) as participant_count
FROM unified_participants 
WHERE conversation_type = 'group';

-- 4. SHOW SAMPLE MIGRATED MESSAGES
SELECT 'SAMPLE MIGRATED MESSAGES' as section;
SELECT id, conversation_id, sender_id, message_text, created_at
FROM unified_messages 
WHERE conversation_type = 'group'
ORDER BY created_at DESC
LIMIT 5;
