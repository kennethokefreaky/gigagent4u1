-- CLEANUP CONFLICTING MESSAGING TABLES
-- This removes the old conflicting tables that are causing issues
-- Run this in your Supabase SQL editor

-- 1. DROP OLD CONFLICTING TABLES (these are causing the problems!)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_participants CASCADE;
DROP TABLE IF EXISTS message_read_status CASCADE;
DROP TABLE IF EXISTS private_chat_messages CASCADE;
DROP TABLE IF EXISTS private_chat_participants CASCADE;

-- 2. DROP ALL PROBLEMATIC FUNCTIONS
DROP FUNCTION IF EXISTS send_unified_message(TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS get_unified_messages(TEXT, UUID);
DROP FUNCTION IF EXISTS send_group_message(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS get_group_messages(TEXT, UUID);

-- 3. VERIFY CLEANUP
SELECT 'Conflicting tables and functions removed' as status;

-- 4. SHOW REMAINING TABLES
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%message%' OR table_name LIKE '%participant%'
ORDER BY table_name;
