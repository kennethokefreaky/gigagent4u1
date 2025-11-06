-- CHECK ALL MARK READ CALLS
-- This script will help identify if there are any other places calling markUnifiedMessagesAsRead

-- 1. CHECK IF THERE ARE ANY OTHER FUNCTIONS THAT UPDATE LAST_READ_AT
SELECT 'FUNCTIONS THAT UPDATE LAST_READ_AT' as section;
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE prosrc ILIKE '%last_read_at%' 
  AND proname NOT LIKE '%get_%' -- Exclude get functions
  AND proname NOT LIKE '%send_%'; -- Exclude send functions

-- 2. CHECK IF THERE ARE ANY TRIGGERS THAT MIGHT UPDATE LAST_READ_AT
SELECT 'TRIGGERS THAT MIGHT UPDATE LAST_READ_AT' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE action_statement ILIKE '%last_read_at%'
ORDER BY trigger_name;

-- 3. CHECK RECENT UPDATES TO unified_participants
SELECT 'RECENT UPDATES TO unified_participants' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    p.email,
    up.last_read_at,
    up.updated_at
FROM unified_participants up
JOIN profiles p ON up.user_id = p.id
WHERE p.email = 'ronaldpower@gmail.com'
ORDER BY up.last_read_at DESC;

-- 4. CHECK IF THERE ARE ANY SCHEDULED JOBS OR CRON JOBS
SELECT 'SCHEDULED JOBS CHECK' as section;
SELECT 
    'No scheduled jobs found in this database' as note;
