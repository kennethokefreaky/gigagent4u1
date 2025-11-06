-- AUDIT GROUP MESSAGE NOTIFICATIONS
-- This will check why group message notifications aren't working
-- Run this in your Supabase SQL editor

-- 1. CHECK IF THE TRIGGER EXISTS
SELECT 'GROUP MESSAGE TRIGGER CHECK' as section;

SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'create_group_message_notification'
AND event_object_schema = 'public';

-- 2. CHECK IF THE FUNCTION EXISTS
SELECT 'GROUP MESSAGE FUNCTION CHECK' as section;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_group_message_notification'
AND routine_schema = 'public';

-- 3. CHECK RECENT GROUP MESSAGES
SELECT 'RECENT GROUP MESSAGES' as section;

SELECT 
    id,
    event_id,
    sender_id,
    message_text,
    created_at
FROM messages 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 4. CHECK RECENT NOTIFICATIONS
SELECT 'RECENT NOTIFICATIONS' as section;

SELECT 
    id,
    user_id,
    type,
    title,
    message,
    message_type,
    created_at
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 5. CHECK GROUP PARTICIPANTS FOR RECENT MESSAGES
SELECT 'GROUP PARTICIPANTS CHECK' as section;

SELECT DISTINCT
    m.event_id,
    m.sender_id,
    mp.user_id as participant_id,
    p.full_name as participant_name,
    m.created_at
FROM messages m
JOIN message_participants mp ON m.event_id = mp.event_id
LEFT JOIN profiles p ON mp.user_id = p.id
WHERE m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC;

-- 6. CHECK IF KEITH CAROLS IS A PARTICIPANT
SELECT 'KEITH CAROLS PARTICIPATION CHECK' as section;

SELECT 
    mp.event_id,
    mp.user_id,
    p.full_name,
    p.email
FROM message_participants mp
LEFT JOIN profiles p ON mp.user_id = p.id
WHERE p.email LIKE '%keith%' OR p.full_name LIKE '%keith%'
ORDER BY mp.event_id;

-- 7. CHECK NOTIFICATION TYPES
SELECT 'NOTIFICATION TYPES CHECK' as section;

SELECT 
    type,
    message_type,
    COUNT(*) as count
FROM notifications 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY type, message_type
ORDER BY count DESC;

-- 8. TEST THE TRIGGER MANUALLY
SELECT 'MANUAL TRIGGER TEST' as section;

-- This will show if we can manually create a group notification
SELECT 'Testing if we can create group notifications...' as test;
