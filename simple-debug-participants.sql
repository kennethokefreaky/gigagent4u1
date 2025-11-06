-- SIMPLE DEBUG - NO PLACEHOLDERS NEEDED
-- This script shows what tables exist and have data
-- Run this in your Supabase SQL editor

-- 1. CHECK WHAT MESSAGING TABLES EXIST
SELECT 'EXISTING MESSAGING TABLES' as section;

SELECT table_name, 
       CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%participant%' OR table_name LIKE '%message%')
ORDER BY table_name;

-- 2. CHECK ROW COUNTS IN EACH TABLE
SELECT 'TABLE ROW COUNTS' as section;

-- Check unified_participants
SELECT 'unified_participants' as table_name, COUNT(*) as row_count
FROM unified_participants

UNION ALL

-- Check message_participants  
SELECT 'message_participants' as table_name, COUNT(*) as row_count
FROM message_participants

UNION ALL

-- Check messages
SELECT 'messages' as table_name, COUNT(*) as row_count
FROM messages

UNION ALL

-- Check unified_messages
SELECT 'unified_messages' as table_name, COUNT(*) as row_count
FROM unified_messages;

-- 3. SHOW SAMPLE DATA FROM EACH TABLE
SELECT 'SAMPLE DATA FROM unified_participants' as section;
SELECT conversation_id, user_id, conversation_type 
FROM unified_participants 
LIMIT 5;

SELECT 'SAMPLE DATA FROM message_participants' as section;
SELECT event_id, user_id 
FROM message_participants 
LIMIT 5;

-- 4. CHECK FOR RECENT ACTIVITY
SELECT 'RECENT ACTIVITY' as section;

-- Recent unified_participants (check if table has created_at column)
SELECT 'unified_participants' as source, COUNT(*) as recent_count
FROM unified_participants

UNION ALL

-- Recent message_participants
SELECT 'message_participants' as source, COUNT(*) as recent_count
FROM message_participants

UNION ALL

-- Recent messages
SELECT 'messages' as source, COUNT(*) as recent_count
FROM messages

UNION ALL

-- Recent unified_messages
SELECT 'unified_messages' as source, COUNT(*) as recent_count
FROM unified_messages;
