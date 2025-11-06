-- Investigate Group Chats Only
-- Run this after checking trash table to see orphaned group chats

-- 1. Check all group chats (unified_participants)
SELECT 
    'GROUP CHATS (UNIFIED)' as source,
    conversation_id,
    conversation_type,
    user_id,
    joined_at,
    last_read_at
FROM unified_participants 
WHERE conversation_type = 'group'
ORDER BY joined_at DESC;

-- 2. Check all group chats (message_participants)
SELECT 
    'GROUP CHATS (MESSAGE)' as source,
    event_id,
    user_id,
    joined_at,
    last_read_at
FROM message_participants 
ORDER BY joined_at DESC;

-- 3. Find group chats that reference trashed posts
WITH group_conversations AS (
    SELECT DISTINCT 
        conversation_id,
        REPLACE(conversation_id, 'group_', '') as event_id
    FROM unified_participants 
    WHERE conversation_type = 'group'
),
trashed_posts AS (
    SELECT DISTINCT original_post_id::text as id
    FROM trash
)
SELECT 
    'ORPHANED GROUP CHATS (UNIFIED)' as issue_type,
    gc.conversation_id,
    gc.event_id,
    'Group chat references trashed post' as reason
FROM group_conversations gc
JOIN trashed_posts tp ON tp.id = gc.event_id;

-- 4. Find message_participants that reference trashed posts
WITH trashed_posts AS (
    SELECT DISTINCT original_post_id::text as id
    FROM trash
)
SELECT 
    'ORPHANED GROUP CHATS (MESSAGE)' as issue_type,
    mp.event_id,
    mp.user_id,
    'Message participant references trashed post' as reason
FROM message_participants mp
JOIN trashed_posts tp ON tp.id = mp.event_id::text;

-- 5. Check for duplicate group chat entries
SELECT 
    'DUPLICATE GROUP CHATS' as issue_type,
    conversation_id,
    COUNT(*) as participant_count,
    array_agg(user_id) as user_ids
FROM unified_participants 
WHERE conversation_type = 'group'
GROUP BY conversation_id
HAVING COUNT(*) > 1;

-- 6. Check for duplicate message_participants
SELECT 
    'DUPLICATE MESSAGE PARTICIPANTS' as issue_type,
    event_id,
    user_id,
    COUNT(*) as duplicate_count
FROM message_participants 
GROUP BY event_id, user_id
HAVING COUNT(*) > 1;

-- 7. Summary of group chat issues
WITH group_conversations AS (
    SELECT DISTINCT 
        conversation_id,
        REPLACE(conversation_id, 'group_', '') as event_id
    FROM unified_participants 
    WHERE conversation_type = 'group'
),
trashed_posts AS (
    SELECT DISTINCT original_post_id::text as id
    FROM trash
),
orphaned_unified AS (
    SELECT COUNT(*) as count FROM group_conversations gc
    JOIN trashed_posts tp ON tp.id = gc.event_id
),
orphaned_message AS (
    SELECT COUNT(*) as count FROM message_participants mp
    JOIN trashed_posts tp ON tp.id::text = mp.event_id::text
)
SELECT 
    'SUMMARY' as report_type,
    (SELECT count FROM orphaned_unified) as orphaned_unified_chats,
    (SELECT count FROM orphaned_message) as orphaned_message_participants,
    (SELECT COUNT(DISTINCT conversation_id) FROM unified_participants WHERE conversation_type = 'group') as total_group_chats,
    (SELECT COUNT(DISTINCT event_id) FROM message_participants) as total_message_groups;
