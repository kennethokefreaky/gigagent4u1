-- SIMPLE GROUP NOTIFICATION AUDIT
-- This will check the key issues step by step
-- Run this in your Supabase SQL editor

-- 1. CHECK IF TRIGGER EXISTS
SELECT '1. TRIGGER CHECK' as section;
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'create_group_message_notification';

-- 2. CHECK IF FUNCTION EXISTS  
SELECT '2. FUNCTION CHECK' as section;
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'create_group_message_notification';

-- 3. CHECK RECENT MESSAGES
SELECT '3. RECENT MESSAGES' as section;
SELECT COUNT(*) as message_count FROM messages 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 4. CHECK RECENT NOTIFICATIONS
SELECT '4. RECENT NOTIFICATIONS' as section;
SELECT COUNT(*) as notification_count FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 5. CHECK PARTICIPANTS FOR SPECIFIC EVENT
SELECT '5. PARTICIPANTS CHECK' as section;
SELECT mp.user_id, p.full_name, p.email 
FROM message_participants mp
LEFT JOIN profiles p ON mp.user_id = p.id
WHERE mp.event_id = 'a55d650a-5c20-4e47-b600-a77d9d57df50';

-- 6. CHECK KEITH CAROLS SPECIFICALLY
SELECT '6. KEITH CAROLS CHECK' as section;
SELECT p.id, p.full_name, p.email 
FROM profiles p
WHERE p.email LIKE '%keith%' OR p.full_name LIKE '%keith%';

-- 7. TEST NOTIFICATION CREATION
SELECT '7. NOTIFICATION TEST' as section;
SELECT 'Ready to test notification creation' as status;
