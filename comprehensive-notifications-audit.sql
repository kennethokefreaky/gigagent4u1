-- COMPREHENSIVE NOTIFICATIONS AUDIT
-- This will show us exactly what's happening with the notification system
-- Run this in your Supabase SQL editor

-- 1. CHECK NOTIFICATIONS TABLE STRUCTURE
SELECT 'NOTIFICATIONS TABLE STRUCTURE' as section;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. CHECK CURRENT CONSTRAINT
SELECT 'CURRENT NOTIFICATION CONSTRAINT' as section;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- 3. CHECK EXISTING NOTIFICATION TYPES
SELECT 'EXISTING NOTIFICATION TYPES' as section;

SELECT DISTINCT type, COUNT(*) as count
FROM notifications 
GROUP BY type
ORDER BY type;

-- 4. CHECK FOR MESSAGE_TYPE COLUMN
SELECT 'MESSAGE_TYPE COLUMN CHECK' as section;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'message_type'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as message_type_status;

-- 5. CHECK EXISTING NOTIFICATIONS DATA
SELECT 'SAMPLE NOTIFICATIONS DATA' as section;

SELECT type, title, message, created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. CHECK FOR TRIGGERS ON MESSAGES TABLE
SELECT 'TRIGGERS ON MESSAGES TABLE' as section;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
AND event_object_schema = 'public';

-- 7. CHECK FOR TRIGGERS ON UNIFIED_MESSAGES TABLE
SELECT 'TRIGGERS ON UNIFIED_MESSAGES TABLE' as section;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'unified_messages'
AND event_object_schema = 'public';

-- 8. CHECK NOTIFICATION FUNCTIONS
SELECT 'NOTIFICATION FUNCTIONS' as section;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%notification%' OR routine_name LIKE '%message%')
ORDER BY routine_name;

-- 9. CHECK RECENT ACTIVITY
SELECT 'RECENT NOTIFICATION ACTIVITY' as section;

SELECT 
    type,
    COUNT(*) as recent_count,
    MAX(created_at) as latest_notification
FROM notifications 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY recent_count DESC;

-- 10. CHECK FOR ANY CONSTRAINT VIOLATIONS
SELECT 'CONSTRAINT VIOLATION CHECK' as section;

SELECT 
    'Checking for invalid notification types...' as status,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN type NOT IN ('new_message', 'group_message', 'message', 'notification') THEN 1 END) as potentially_invalid_types
FROM notifications;
