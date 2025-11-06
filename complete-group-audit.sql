-- COMPLETE GROUP NOTIFICATION AUDIT
-- This shows all checks at once
-- Run this in your Supabase SQL editor

-- Step 1: Check if trigger exists
SELECT 'Step 1 - Trigger exists?' as question, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.triggers 
         WHERE trigger_name = 'create_group_message_notification'
       ) THEN 'YES' ELSE 'NO' END as answer

UNION ALL

-- Step 2: Check if function exists
SELECT 'Step 2 - Function exists?' as question,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.routines 
         WHERE routine_name = 'create_group_message_notification'
       ) THEN 'YES' ELSE 'NO' END as answer

UNION ALL

-- Step 3: Count recent messages
SELECT 'Step 3 - Recent messages count?' as question, 
       COUNT(*)::text as answer 
FROM messages 
WHERE created_at > NOW() - INTERVAL '1 hour'

UNION ALL

-- Step 4: Count recent notifications
SELECT 'Step 4 - Recent notifications count?' as question, 
       COUNT(*)::text as answer 
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'

UNION ALL

-- Step 5: Check if Keith Carols exists
SELECT 'Step 5 - Keith Carols exists?' as question,
       CASE WHEN EXISTS (
         SELECT 1 FROM profiles 
         WHERE email LIKE '%keith%' OR full_name LIKE '%keith%'
       ) THEN 'YES' ELSE 'NO' END as answer;
