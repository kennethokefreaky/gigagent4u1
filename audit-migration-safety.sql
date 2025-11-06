-- AUDIT MIGRATION SAFETY
-- Check if migrating all group chats is safe and wise
-- Run this in your Supabase SQL editor

-- 1. CHECK CURRENT DATA VOLUME
SELECT 'CURRENT DATA VOLUME' as section;
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
WHERE event_id IS NOT NULL
UNION ALL
SELECT 
    'unified_participants' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT conversation_id) as unique_conversations
FROM unified_participants
WHERE conversation_type = 'group'
UNION ALL
SELECT 
    'unified_messages' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT sender_id) as unique_senders,
    COUNT(DISTINCT conversation_id) as unique_conversations
FROM unified_messages
WHERE conversation_type = 'group';

-- 2. CHECK FOR DATA CONFLICTS
SELECT 'CHECK FOR DATA CONFLICTS' as section;
SELECT 
    'Potential conflicts in unified_participants' as check_type,
    COUNT(*) as conflict_count
FROM unified_participants up1
JOIN message_participants mp ON 'group_' || mp.event_id = up1.conversation_id
WHERE mp.event_id IS NOT NULL;

-- 3. CHECK FOR DUPLICATE MESSAGES
SELECT 'CHECK FOR DUPLICATE MESSAGES' as section;
SELECT 
    'Potential duplicate messages' as check_type,
    COUNT(*) as duplicate_count
FROM unified_messages um1
JOIN messages m ON 'group_' || m.event_id = um1.conversation_id
WHERE m.event_id IS NOT NULL;

-- 4. CHECK USER PARTICIPATION OVERLAP
SELECT 'CHECK USER PARTICIPATION OVERLAP' as section;
SELECT 
    p.email,
    p.role,
    COUNT(DISTINCT mp.event_id) as old_group_chats,
    COUNT(DISTINCT up.conversation_id) as new_group_chats
FROM profiles p
LEFT JOIN message_participants mp ON p.id = mp.user_id AND mp.event_id IS NOT NULL
LEFT JOIN unified_participants up ON p.id = up.user_id AND up.conversation_type = 'group'
GROUP BY p.email, p.role
ORDER BY p.role, p.email;

-- 5. CHECK MESSAGE VOLUME BY USER
SELECT 'CHECK MESSAGE VOLUME BY USER' as section;
SELECT 
    p.email,
    p.role,
    COUNT(DISTINCT m.event_id) as old_group_messages,
    COUNT(DISTINCT um.conversation_id) as new_group_messages
FROM profiles p
LEFT JOIN messages m ON p.id = m.sender_id AND m.event_id IS NOT NULL
LEFT JOIN unified_messages um ON p.id = um.sender_id AND um.conversation_type = 'group'
GROUP BY p.email, p.role
ORDER BY p.role, p.email;

-- 6. SAFETY ASSESSMENT
SELECT 'SAFETY ASSESSMENT' as section;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM message_participants WHERE event_id IS NOT NULL) = 0 
        THEN 'SAFE: No old group chat data to migrate'
        WHEN (SELECT COUNT(*) FROM unified_participants WHERE conversation_type = 'group') = 0 
        THEN 'SAFE: No existing unified group data to conflict with'
        WHEN (SELECT COUNT(*) FROM message_participants WHERE event_id IS NOT NULL) > 
             (SELECT COUNT(*) FROM unified_participants WHERE conversation_type = 'group')
        THEN 'CAUTION: More old data than new data - migration will add significant data'
        ELSE 'SAFE: Migration will update existing data'
    END as migration_safety;
