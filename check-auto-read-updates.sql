-- CHECK AUTO READ UPDATES
-- Check what's automatically updating last_read_at timestamps
-- Run this in your Supabase SQL editor

-- 1. CHECK FOR TRIGGERS ON UNIFIED_PARTICIPANTS
SELECT 'TRIGGERS ON UNIFIED_PARTICIPANTS' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'unified_participants'
ORDER BY trigger_name;

-- 2. CHECK FOR TRIGGERS ON UNIFIED_MESSAGES
SELECT 'TRIGGERS ON UNIFIED_MESSAGES' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'unified_messages'
ORDER BY trigger_name;

-- 3. CHECK RECENT UPDATES TO UNIFIED_PARTICIPANTS
SELECT 'RECENT UPDATES TO UNIFIED_PARTICIPANTS' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email,
    p.role
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE up.last_read_at > '2025-09-30 00:00:00'
ORDER BY up.last_read_at DESC;

-- 4. CHECK IF THERE ARE AUTO-UPDATE FUNCTIONS
SELECT 'AUTO-UPDATE FUNCTIONS' as section;
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%read%' 
   OR routine_name LIKE '%mark%'
   OR routine_name LIKE '%unified%'
ORDER BY routine_name;
