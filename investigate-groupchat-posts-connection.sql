-- Investigate Group Chat and Posts Connection
-- This script helps identify which group chats are associated with removed/deleted posts

-- 1. Check all posts (active, completed, cancelled)
SELECT 
    'ACTIVE POSTS' as source,
    id,
    title,
    created_at,
    promoter_id
FROM posts 
ORDER BY created_at DESC;

-- 2. Check posts in trash (removed events)
SELECT 
    'TRASH POSTS' as source,
    original_post_id as id,
    post_data->>'title' as title,
    'removed' as status,
    removed_at as created_at,
    post_data->>'promoter_id' as promoter_id
FROM trash 
ORDER BY removed_at DESC;

-- 3. Check all group chats (unified_participants)
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

-- 4. Check group chats (message_participants)
SELECT 
    'GROUP CHATS (MESSAGE)' as source,
    event_id,
    user_id,
    joined_at,
    last_read_at
FROM message_participants 
ORDER BY joined_at DESC;

-- 5. Find group chats that reference non-existent posts
WITH group_conversations AS (
    SELECT DISTINCT 
        conversation_id,
        REPLACE(conversation_id, 'group_', '') as event_id
    FROM unified_participants 
    WHERE conversation_type = 'group'
),
all_posts AS (
    SELECT id FROM posts
    UNION
    SELECT original_post_id::text FROM trash
)
SELECT 
    'ORPHANED GROUP CHATS (UNIFIED)' as issue_type,
    gc.conversation_id,
    gc.event_id,
    'Group chat references non-existent post' as reason
FROM group_conversations gc
LEFT JOIN all_posts ap ON ap.id = gc.event_id
WHERE ap.id IS NULL;

-- 6. Find message_participants that reference non-existent posts
WITH all_posts AS (
    SELECT id FROM posts
    UNION
    SELECT original_post_id::text FROM trash
)
SELECT 
    'ORPHANED GROUP CHATS (MESSAGE)' as issue_type,
    mp.event_id,
    mp.user_id,
    'Message participant references non-existent post' as reason
FROM message_participants mp
LEFT JOIN all_posts ap ON ap.id = mp.event_id
WHERE ap.id IS NULL;

-- 7. Check for duplicate group chat entries
SELECT 
    'DUPLICATE GROUP CHATS' as issue_type,
    conversation_id,
    COUNT(*) as participant_count,
    array_agg(user_id) as user_ids
FROM unified_participants 
WHERE conversation_type = 'group'
GROUP BY conversation_id
HAVING COUNT(*) > 1;

-- 8. Check for duplicate message_participants
SELECT 
    'DUPLICATE MESSAGE PARTICIPANTS' as issue_type,
    event_id,
    user_id,
    COUNT(*) as duplicate_count
FROM message_participants 
GROUP BY event_id, user_id
HAVING COUNT(*) > 1;

-- 9. Summary of group chat issues
WITH group_conversations AS (
    SELECT DISTINCT 
        conversation_id,
        REPLACE(conversation_id, 'group_', '') as event_id
    FROM unified_participants 
    WHERE conversation_type = 'group'
),
all_posts AS (
    SELECT id FROM posts
    UNION
    SELECT original_post_id::text FROM trash
),
orphaned_unified AS (
    SELECT COUNT(*) as count FROM group_conversations gc
    LEFT JOIN all_posts ap ON ap.id = gc.event_id
    WHERE ap.id IS NULL
),
orphaned_message AS (
    SELECT COUNT(*) as count FROM message_participants mp
    LEFT JOIN all_posts ap ON ap.id = mp.event_id
    WHERE ap.id IS NULL
)
SELECT 
    'SUMMARY' as report_type,
    (SELECT count FROM orphaned_unified) as orphaned_unified_chats,
    (SELECT count FROM orphaned_message) as orphaned_message_participants,
    (SELECT COUNT(DISTINCT conversation_id) FROM unified_participants WHERE conversation_type = 'group') as total_group_chats,
    (SELECT COUNT(DISTINCT event_id) FROM message_participants) as total_message_groups;
