-- CHECK JOIN UNIFIED CONVERSATION FUNCTION
-- Check what this function does and if it's updating last_read_at
-- Run this in your Supabase SQL editor

-- 1. GET FULL FUNCTION DEFINITION
SELECT 'JOIN UNIFIED CONVERSATION FUNCTION DEFINITION' as section;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'join_unified_conversation';

-- 2. CHECK IF FUNCTION IS BEING CALLED
SELECT 'RECENT FUNCTION CALLS' as section;
SELECT 
    'Check if function is being called automatically' as note;

-- 3. CHECK IF THERE ARE ANY TRIGGERS CALLING THIS FUNCTION
SELECT 'TRIGGERS CALLING JOIN FUNCTION' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%join_unified_conversation%'
ORDER BY trigger_name;

-- 4. CHECK IF FUNCTION UPDATES LAST_READ_AT
SELECT 'FUNCTION UPDATES CHECK' as section;
SELECT 
    CASE 
        WHEN routine_definition LIKE '%last_read_at%' 
        THEN 'WARNING: Function updates last_read_at'
        ELSE 'OK: Function does not update last_read_at'
    END as function_analysis
FROM information_schema.routines 
WHERE routine_name = 'join_unified_conversation';
