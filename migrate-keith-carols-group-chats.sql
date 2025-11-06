-- MIGRATE KEITH CAROLS GROUP CHATS TO UNIFIED SYSTEM
-- This will move his group chat data from old system to new system
-- Run this in your Supabase SQL editor

-- 1. CHECK KEITH CAROLS' OLD GROUP CHAT PARTICIPATIONS
SELECT 'KEITH CAROLS OLD GROUP CHAT PARTICIPATIONS' as section;
SELECT 
    mp.event_id,
    mp.user_id,
    mp.last_read_at,
    p.title as event_title,
    p.promoter_id
FROM message_participants mp
LEFT JOIN posts p ON mp.event_id = p.id
LEFT JOIN profiles pr ON mp.user_id = pr.id
WHERE pr.email = 'keithcarols@gmail.com'
ORDER BY mp.last_read_at DESC;

-- 2. CHECK KEITH CAROLS' NEW UNIFIED PARTICIPATIONS
SELECT 'KEITH CAROLS NEW UNIFIED PARTICIPATIONS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    up.last_read_at
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE p.email = 'keithcarols@gmail.com'
ORDER BY up.last_read_at DESC;

-- 3. MIGRATE KEITH CAROLS' GROUP CHAT PARTICIPATIONS
SELECT 'MIGRATING KEITH CAROLS GROUP CHAT PARTICIPATIONS' as section;
INSERT INTO unified_participants (conversation_id, conversation_type, user_id, last_read_at)
SELECT 
    'group_' || mp.event_id as conversation_id,
    'group' as conversation_type,
    mp.user_id,
    mp.last_read_at
FROM message_participants mp
LEFT JOIN profiles p ON mp.user_id = p.id
WHERE p.email = 'keithcarols@gmail.com'
    AND mp.event_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO UPDATE SET
    last_read_at = EXCLUDED.last_read_at;

-- 4. MIGRATE KEITH CAROLS' GROUP CHAT MESSAGES
SELECT 'MIGRATING KEITH CAROLS GROUP CHAT MESSAGES' as section;
INSERT INTO unified_messages (conversation_id, conversation_type, sender_id, message_text, created_at)
SELECT 
    'group_' || m.event_id as conversation_id,
    'group' as conversation_type,
    m.sender_id,
    m.message_text,
    m.created_at
FROM messages m
LEFT JOIN message_participants mp ON m.event_id = mp.event_id
LEFT JOIN profiles p ON mp.user_id = p.id
WHERE p.email = 'keithcarols@gmail.com'
    AND m.event_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. VERIFY MIGRATION
SELECT 'VERIFY MIGRATION' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    up.last_read_at,
    COUNT(um.id) as message_count
FROM unified_participants up
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
LEFT JOIN profiles p ON up.user_id = p.id
WHERE p.email = 'keithcarols@gmail.com'
    AND up.conversation_type = 'group'
GROUP BY up.conversation_id, up.conversation_type, up.user_id, up.last_read_at
ORDER BY up.last_read_at DESC;
