-- COMPREHENSIVE MESSAGING SYSTEM TEST
-- This script tests all aspects of the messaging system

-- 1. Test that all required tables exist
SELECT 'Testing table existence...' as test_step;

-- Check messages table
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') 
    THEN '✅ messages table exists'
    ELSE '❌ messages table missing'
  END as messages_table;

-- Check message_participants table
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_participants') 
    THEN '✅ message_participants table exists'
    ELSE '❌ message_participants table missing'
  END as message_participants_table;

-- Check private_chat_messages table
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_chat_messages') 
    THEN '✅ private_chat_messages table exists'
    ELSE '❌ private_chat_messages table missing'
  END as private_chat_messages_table;

-- Check private_chat_participants table
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_chat_participants') 
    THEN '✅ private_chat_participants table exists'
    ELSE '❌ private_chat_participants table missing'
  END as private_chat_participants_table;

-- 2. Test RLS policies
SELECT 'Testing RLS policies...' as test_step;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('messages', 'message_participants', 'private_chat_messages', 'private_chat_participants')
  AND schemaname = 'public';

-- 3. Test triggers
SELECT 'Testing triggers...' as test_step;

-- Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name IN (
  'add_promoter_to_conversation',
  'add_talent_to_conversation', 
  'add_talent_to_group_chat_on_offer_acceptance',
  'ensure_private_chat_participants',
  'create_private_message_notification',
  'create_group_message_notification'
);

-- 4. Test functions
SELECT 'Testing functions...' as test_step;

-- Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN (
  'add_promoter_to_event_conversation',
  'add_talent_to_event_conversation',
  'add_talent_to_group_chat_on_offer_acceptance',
  'ensure_private_chat_participants',
  'create_private_message_notification',
  'create_group_message_notification'
);

-- 5. Test indexes
SELECT 'Testing indexes...' as test_step;

-- Check if performance indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename IN ('messages', 'message_participants', 'private_chat_messages', 'private_chat_participants')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. Test data integrity
SELECT 'Testing data integrity...' as test_step;

-- Check for orphaned records
SELECT 
  'Orphaned message_participants' as issue_type,
  COUNT(*) as count
FROM message_participants mp
LEFT JOIN posts p ON mp.event_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Orphaned messages' as issue_type,
  COUNT(*) as count
FROM messages m
LEFT JOIN posts p ON m.event_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Orphaned private_chat_messages' as issue_type,
  COUNT(*) as count
FROM private_chat_messages pcm
LEFT JOIN private_chat_participants pcp ON pcm.chat_id = pcp.chat_id
WHERE pcp.chat_id IS NULL;

-- 7. Test notification system
SELECT 'Testing notification system...' as test_step;

-- Check if notifications table exists and has proper structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Summary report
SELECT 'MESSAGING SYSTEM TEST COMPLETE' as status;
