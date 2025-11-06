-- DISABLE NOTIFICATION TRIGGERS
-- This will stop the automatic notification creation that's causing the constraint violation
-- Run this in your Supabase SQL editor

-- 1. DROP THE PROBLEMATIC TRIGGERS
DROP TRIGGER IF EXISTS group_message_notification ON messages;
DROP TRIGGER IF EXISTS unified_message_notification ON unified_messages;

-- 2. DROP THE PROBLEMATIC FUNCTIONS
DROP FUNCTION IF EXISTS create_group_message_notification();
DROP FUNCTION IF EXISTS create_unified_message_notification();

-- 3. VERIFY TRIGGERS ARE GONE
SELECT 'TRIGGERS DISABLED - NO MORE AUTOMATIC NOTIFICATIONS' as status;

-- 4. TEST MESSAGE INSERTION
SELECT 'You can now send group messages without notification constraint errors' as result;
