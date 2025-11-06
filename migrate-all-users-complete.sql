-- MIGRATE ALL USERS' GROUP CHATS TO UNIFIED SYSTEM
-- This will move ALL users' group chat data from old system to new system
-- Run this in your Supabase SQL editor

-- 1. MIGRATE ALL USERS' GROUP CHAT PARTICIPATIONS
SELECT 'MIGRATING ALL USERS GROUP CHAT PARTICIPATIONS' as section;
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

-- 2. MIGRATE ALL USERS' GROUP CHAT MESSAGES
SELECT 'MIGRATING ALL USERS GROUP CHAT MESSAGES' as section;
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

-- 3. VERIFY MIGRATION FOR ALL USERS
SELECT 'VERIFY MIGRATION FOR ALL USERS' as section;
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

-- 4. CHECK SPECIFIC "NEED A WRESTLER" GROUP CHAT
SELECT 'CHECK NEED A WRESTLER GROUP CHAT' as section;
SELECT 
    up.conversation_id,
    up.user_id,
    p.full_name,
    p.email,
    p.role,
    up.last_read_at,
    COUNT(um.id) as unread_count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    AND um.created_at > up.last_read_at
    AND um.sender_id != up.user_id
WHERE up.conversation_id LIKE '%wrestler%' OR up.conversation_id IN (
    SELECT 'group_' || id 
    FROM posts 
    WHERE title ILIKE '%wrestler%'
)
GROUP BY up.conversation_id, up.user_id, p.full_name, p.email, p.role, up.last_read_at
ORDER BY unread_count DESC;
