-- SIMPLE MIGRATE ALL USERS' GROUP CHATS
-- This will safely move ALL users' group chat data to unified system
-- Run this in your Supabase SQL editor

-- 1. CHECK WHAT WE HAVE IN OLD SYSTEM
SELECT 'OLD SYSTEM DATA' as section;
SELECT 
    'message_participants' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT event_id) as unique_events
FROM message_participants
WHERE event_id IS NOT NULL
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT sender_id) as unique_senders,
    COUNT(DISTINCT event_id) as unique_events
FROM messages
WHERE event_id IS NOT NULL;

-- 2. MIGRATE ALL USERS' GROUP CHAT PARTICIPATIONS
SELECT 'MIGRATING PARTICIPATIONS' as section;
INSERT INTO unified_participants (conversation_id, conversation_type, user_id, last_read_at)
SELECT 
    'group_' || mp.event_id as conversation_id,
    'group' as conversation_type,
    mp.user_id,
    mp.last_read_at
FROM message_participants mp
WHERE mp.event_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO UPDATE SET
    last_read_at = EXCLUDED.last_read_at;

-- 3. MIGRATE ALL USERS' GROUP CHAT MESSAGES
SELECT 'MIGRATING MESSAGES' as section;
INSERT INTO unified_messages (conversation_id, conversation_type, sender_id, message_text, created_at)
SELECT 
    'group_' || m.event_id as conversation_id,
    'group' as conversation_type,
    m.sender_id,
    m.message_text,
    m.created_at
FROM messages m
WHERE m.event_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. VERIFY MIGRATION
SELECT 'VERIFICATION' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    COUNT(up.conversation_id) as total_group_chats,
    SUM(
        CASE 
            WHEN um.created_at > up.last_read_at 
            AND um.sender_id != up.user_id 
            THEN 1 
            ELSE 0 
        END
    ) as total_unread_messages
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE up.conversation_type = 'group'
GROUP BY p.full_name, p.email, p.role
ORDER BY p.role, total_unread_messages DESC;
