-- MIGRATE ALL USERS' GROUP CHATS TO UNIFIED SYSTEM
-- This will move ALL users' group chat data from old system to new system
-- Run this in your Supabase SQL editor

-- 1. CHECK ALL OLD GROUP CHAT PARTICIPATIONS
SELECT 'ALL OLD GROUP CHAT PARTICIPATIONS' as section;
SELECT 
    mp.event_id,
    mp.user_id,
    mp.last_read_at,
    p.title as event_title,
    p.promoter_id,
    pr.full_name,
    pr.email,
    pr.role
FROM message_participants mp
LEFT JOIN posts p ON mp.event_id = p.id
LEFT JOIN profiles pr ON mp.user_id = pr.id
WHERE mp.event_id IS NOT NULL
ORDER BY pr.role, pr.email, mp.last_read_at DESC;

-- 2. CHECK ALL NEW UNIFIED PARTICIPATIONS
SELECT 'ALL NEW UNIFIED PARTICIPATIONS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email,
    p.role
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE up.conversation_type = 'group'
ORDER BY p.role, p.email, up.last_read_at DESC;

-- 3. MIGRATE ALL USERS' GROUP CHAT PARTICIPATIONS
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

-- 4. MIGRATE ALL USERS' GROUP CHAT MESSAGES
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

-- 5. VERIFY MIGRATION FOR ALL USERS
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

-- 6. SUMMARY BY ROLE
SELECT 'SUMMARY BY ROLE' as section;
SELECT 
    p.role,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT up.conversation_id) as total_group_chats,
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
GROUP BY p.role
ORDER BY p.role;
