-- AUDIT BEFORE REMOVAL - SYSTEMATIC APPROACH
-- This script audits what tables/functions are actually being used
-- ALWAYS run this before suggesting to remove anything
-- Run this in your Supabase SQL editor

-- 1. AUDIT ALL MESSAGING TABLES
SELECT 'MESSAGING TABLES AUDIT' as section;

SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%message%' OR table_name LIKE '%participant%' OR table_name LIKE '%unified%' OR table_name LIKE '%group%' OR table_name LIKE '%private%')
ORDER BY table_name;

-- 2. AUDIT ALL MESSAGING FUNCTIONS
SELECT 'MESSAGING FUNCTIONS AUDIT' as section;

SELECT 
  routine_name,
  CASE WHEN routine_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%message%' OR routine_name LIKE '%unified%' OR routine_name LIKE '%group%' OR routine_name LIKE '%private%')
ORDER BY routine_name;

-- 3. CHECK DATA IN EACH TABLE
SELECT 'TABLE DATA AUDIT' as section;

-- Check unified tables
SELECT 'unified_messages' as table_name, COUNT(*) as row_count FROM unified_messages
UNION ALL
SELECT 'unified_participants' as table_name, COUNT(*) as row_count FROM unified_participants
UNION ALL
SELECT 'group_messages' as table_name, COUNT(*) as row_count FROM group_messages
UNION ALL
SELECT 'group_participants' as table_name, COUNT(*) as row_count FROM group_participants
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as row_count FROM messages
UNION ALL
SELECT 'message_participants' as table_name, COUNT(*) as row_count FROM message_participants
UNION ALL
SELECT 'message_read_status' as table_name, COUNT(*) as row_count FROM message_read_status
UNION ALL
SELECT 'private_chat_messages' as table_name, COUNT(*) as row_count FROM private_chat_messages
UNION ALL
SELECT 'private_chat_participants' as table_name, COUNT(*) as row_count FROM private_chat_participants;

-- 4. CHECK FOR ACTIVE USAGE PATTERNS
SELECT 'USAGE PATTERNS AUDIT' as section;

-- Check if there are recent messages in each system
SELECT 
  'Recent unified messages' as system,
  COUNT(*) as count,
  MAX(created_at) as latest_message
FROM unified_messages 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'Recent group messages' as system,
  COUNT(*) as count,
  MAX(created_at) as latest_message
FROM group_messages 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'Recent old messages' as system,
  COUNT(*) as count,
  MAX(created_at) as latest_message
FROM messages 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'Recent private messages' as system,
  COUNT(*) as count,
  MAX(created_at) as latest_message
FROM private_chat_messages 
WHERE created_at > NOW() - INTERVAL '7 days';
