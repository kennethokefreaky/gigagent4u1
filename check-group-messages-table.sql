-- CHECK GROUP MESSAGES TABLE
-- This will check if group_messages table exists and has data
-- Run this in your Supabase SQL editor

-- 1. CHECK IF GROUP_MESSAGES TABLE EXISTS
SELECT 'GROUP_MESSAGES TABLE EXISTS' as section;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'group_messages';

-- 2. CHECK GROUP_MESSAGES TABLE STRUCTURE
SELECT 'GROUP_MESSAGES TABLE STRUCTURE' as section;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'group_messages'
ORDER BY ordinal_position;

-- 3. CHECK GROUP_MESSAGES DATA
SELECT 'GROUP_MESSAGES DATA' as section;
SELECT 
    id,
    event_id,
    sender_id,
    message_text,
    created_at
FROM group_messages
ORDER BY created_at DESC
LIMIT 10;

-- 4. CHECK GROUP_PARTICIPANTS TABLE
SELECT 'GROUP_PARTICIPANTS TABLE' as section;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'group_participants';

-- 5. CHECK GROUP_PARTICIPANTS DATA
SELECT 'GROUP_PARTICIPANTS DATA' as section;
SELECT 
    event_id,
    user_id,
    last_read_at
FROM group_participants
ORDER BY last_read_at DESC
LIMIT 10;
