-- SAFE MIGRATION PLAN - DON'T DROP TABLES YET
-- This script helps us understand what data exists before making changes
-- Run this in your Supabase SQL editor

-- 1. CHECK WHAT DATA EXISTS IN OLD TABLES
SELECT 'OLD TABLES DATA AUDIT' as section;

SELECT 'private_chat_messages' as table_name, COUNT(*) as row_count FROM private_chat_messages
UNION ALL
SELECT 'private_chat_participants' as table_name, COUNT(*) as row_count FROM private_chat_participants
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as row_count FROM messages
UNION ALL
SELECT 'message_participants' as table_name, COUNT(*) as row_count FROM message_participants;

-- 2. CHECK WHAT DATA EXISTS IN NEW TABLES
SELECT 'NEW TABLES DATA AUDIT' as section;

SELECT 'unified_messages' as table_name, COUNT(*) as row_count FROM unified_messages
UNION ALL
SELECT 'unified_participants' as table_name, COUNT(*) as row_count FROM unified_participants
UNION ALL
SELECT 'group_messages' as table_name, COUNT(*) as row_count FROM group_messages
UNION ALL
SELECT 'group_participants' as table_name, COUNT(*) as row_count FROM group_participants;

-- 3. CHECK FOR DATA CONFLICTS
SELECT 'POTENTIAL CONFLICTS' as section;

-- Check if there are group messages in both old and new systems
SELECT 
  'Group messages in both systems' as issue,
  (SELECT COUNT(*) FROM messages) as old_count,
  (SELECT COUNT(*) FROM group_messages) as new_count;

-- Check if there are private messages in both systems  
SELECT 
  'Private messages in both systems' as issue,
  (SELECT COUNT(*) FROM private_chat_messages) as old_count,
  (SELECT COUNT(*) FROM unified_messages WHERE conversation_type = 'private') as new_count;
