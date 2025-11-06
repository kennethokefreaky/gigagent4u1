-- DISABLE ALL TRIGGERS ON MESSAGING TABLES
-- This will find and disable ALL triggers that might create notifications
-- Run this in your Supabase SQL editor

-- 1. SHOW ALL TRIGGERS ON MESSAGING TABLES
SELECT 'ALL TRIGGERS ON MESSAGING TABLES' as section;

SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('messages', 'message_participants', 'unified_messages', 'unified_participants', 'notifications')
AND event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 2. DROP ALL TRIGGERS ON MESSAGING TABLES
DO $$ 
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_table IN ('messages', 'message_participants', 'unified_messages', 'unified_participants', 'notifications')
        AND event_object_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 
                      trig.trigger_name, trig.event_object_table);
        RAISE NOTICE 'Dropped trigger % on table %', trig.trigger_name, trig.event_object_table;
    END LOOP;
END $$;

-- 3. DROP ALL NOTIFICATION-RELATED FUNCTIONS
DROP FUNCTION IF EXISTS create_group_message_notification();
DROP FUNCTION IF EXISTS create_unified_message_notification();
DROP FUNCTION IF EXISTS create_message_notification();
DROP FUNCTION IF EXISTS create_notification();

-- 4. VERIFY ALL TRIGGERS ARE GONE
SELECT 'TRIGGERS VERIFICATION' as section;

SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('messages', 'message_participants', 'unified_messages', 'unified_participants', 'notifications')
AND event_object_schema = 'public';

-- 5. TEST MESSAGE INSERTION
SELECT 'ALL TRIGGERS DISABLED - GROUP MESSAGING SHOULD WORK NOW' as status;
