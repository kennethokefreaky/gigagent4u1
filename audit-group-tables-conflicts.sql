-- AUDIT GROUP TABLES FOR CONFLICTS
-- Check if group tables exist and could cause conflicts
-- Run this in your Supabase SQL editor

-- 1. CHECK IF GROUP TABLES EXIST
SELECT 'GROUP TABLES EXISTENCE' as section;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('group_messages', 'group_participants', 'messages', 'message_participants')
ORDER BY table_name;

-- 2. CHECK GROUP TABLES DATA (if they exist)
SELECT 'GROUP TABLES DATA' as section;
SELECT 
    'group_messages' as table_name,
    COUNT(*) as record_count
FROM group_messages
UNION ALL
SELECT 
    'group_participants' as table_name,
    COUNT(*) as record_count
FROM group_participants
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as record_count
FROM messages
UNION ALL
SELECT 
    'message_participants' as table_name,
    COUNT(*) as record_count
FROM message_participants;

-- 3. CHECK FOR DATA OVERLAP
SELECT 'DATA OVERLAP CHECK' as section;
SELECT 
    'unified_messages vs messages' as comparison,
    COUNT(DISTINCT um.conversation_id) as unified_conversations,
    COUNT(DISTINCT m.event_id) as old_conversations,
    COUNT(DISTINCT CASE WHEN 'group_' || m.event_id = um.conversation_id THEN um.conversation_id END) as overlapping_conversations
FROM unified_messages um
FULL OUTER JOIN messages m ON 'group_' || m.event_id = um.conversation_id
WHERE um.conversation_type = 'group' OR m.event_id IS NOT NULL;

-- 4. CHECK FOR PARTICIPANT OVERLAP
SELECT 'PARTICIPANT OVERLAP CHECK' as section;
SELECT 
    'unified_participants vs message_participants' as comparison,
    COUNT(DISTINCT up.conversation_id) as unified_conversations,
    COUNT(DISTINCT mp.event_id) as old_conversations,
    COUNT(DISTINCT CASE WHEN 'group_' || mp.event_id = up.conversation_id THEN up.conversation_id END) as overlapping_conversations
FROM unified_participants up
FULL OUTER JOIN message_participants mp ON 'group_' || mp.event_id = up.conversation_id
WHERE up.conversation_type = 'group' OR mp.event_id IS NOT NULL;

-- 5. CHECK FOR CONFLICTING RLS POLICIES
SELECT 'CONFLICTING RLS POLICIES' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('group_messages', 'group_participants', 'messages', 'message_participants')
ORDER BY tablename, policyname;

-- 6. SUMMARY
SELECT 'SUMMARY' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_messages')
        THEN 'WARNING: group_messages table exists - could cause conflicts'
        ELSE 'OK: group_messages table does not exist'
    END as group_messages_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_participants')
        THEN 'WARNING: group_participants table exists - could cause conflicts'
        ELSE 'OK: group_participants table does not exist'
    END as group_participants_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages')
        THEN 'INFO: messages table exists (old system)'
        ELSE 'OK: messages table does not exist'
    END as messages_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_participants')
        THEN 'INFO: message_participants table exists (old system)'
        ELSE 'OK: message_participants table does not exist'
    END as message_participants_status;
