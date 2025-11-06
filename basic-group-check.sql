-- BASIC GROUP NOTIFICATION CHECK
-- Run this in your Supabase SQL editor

-- Check if trigger exists
SELECT 'TRIGGER EXISTS:' as check_type, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.triggers 
         WHERE trigger_name = 'create_group_message_notification'
       ) THEN 'YES' ELSE 'NO' END as result;

-- Check if function exists
SELECT 'FUNCTION EXISTS:' as check_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.routines 
         WHERE routine_name = 'create_group_message_notification'
       ) THEN 'YES' ELSE 'NO' END as result;

-- Count recent messages
SELECT 'RECENT MESSAGES:' as check_type, COUNT(*) as result 
FROM messages WHERE created_at > NOW() - INTERVAL '1 hour';

-- Count recent notifications  
SELECT 'RECENT NOTIFICATIONS:' as check_type, COUNT(*) as result 
FROM notifications WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check if Keith Carols exists
SELECT 'KEITH CAROLS EXISTS:' as check_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM profiles 
         WHERE email LIKE '%keith%' OR full_name LIKE '%keith%'
       ) THEN 'YES' ELSE 'NO' END as result;
