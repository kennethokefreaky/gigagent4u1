-- FIND AUTO READ UPDATES
-- Find what's automatically updating Keith's last_read_at timestamps

-- 1. CHECK TRIGGERS ON unified_participants
SELECT 'TRIGGERS ON unified_participants' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'unified_participants'
ORDER BY trigger_name;

-- 2. CHECK FUNCTIONS THAT MIGHT UPDATE last_read_at
SELECT 'FUNCTIONS THAT UPDATE last_read_at' as section;
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE prosrc ILIKE '%last_read_at%' 
  AND proname NOT LIKE '%get_%'
  AND proname NOT LIKE '%send_%';

-- 3. CHECK RECENT UPDATES TO unified_participants
SELECT 'RECENT UPDATES TO unified_participants' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    p.email
FROM unified_participants up
JOIN profiles p ON up.user_id = p.id
WHERE p.email = 'keithcarols@gmail.com'
ORDER BY up.last_read_at DESC;

-- 4. CHECK IF THERE ARE ANY SCHEDULED JOBS
SELECT 'SCHEDULED JOBS CHECK' as section;
SELECT 
    'No scheduled jobs found in this database' as note;

-- 5. CHECK FOR ANY RLS POLICIES THAT MIGHT AUTO-UPDATE
SELECT 'RLS POLICIES ON unified_participants' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'unified_participants';
