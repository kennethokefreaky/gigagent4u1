-- CHECK UNIFIED MESSAGING SYSTEM STATUS
-- Run this script to see what exists and what's missing

-- 1. Check if unified tables exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('unified_messages', 'unified_participants');

-- 2. Check if unified functions exist
SELECT 
  routine_name,
  CASE WHEN routine_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_unified_messages', 'send_unified_message');

-- 3. Check table structure for unified_messages
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'unified_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check table structure for unified_participants
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'unified_participants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if there's any data in the tables
SELECT 'unified_messages' as table_name, COUNT(*) as row_count FROM unified_messages
UNION ALL
SELECT 'unified_participants' as table_name, COUNT(*) as row_count FROM unified_participants;
