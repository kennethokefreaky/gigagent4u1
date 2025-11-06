-- CHECK FOR TRIGGERS ON MESSAGES TABLE
-- This will show if there are triggers that automatically create notifications
-- Run this in your Supabase SQL editor

-- 1. CHECK FOR TRIGGERS ON MESSAGES TABLE
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
AND event_object_schema = 'public';

-- 2. CHECK FOR TRIGGERS ON ALL MESSAGING TABLES
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table IN ('messages', 'message_participants', 'unified_messages', 'unified_participants')
AND event_object_schema = 'public';

-- 3. CHECK FOR FUNCTIONS THAT MIGHT CREATE NOTIFICATIONS
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%notification%' OR routine_name LIKE '%message%')
ORDER BY routine_name;
