-- Cleanup Orphaned Group Chats
-- This script removes group chats that are associated with non-existent posts

-- STEP 1: Identify orphaned group chats (run this first to see what will be deleted)
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
    'ORPHANED GROUP CHATS TO DELETE' as action,
    gc.conversation_id,
    gc.event_id,
    'Will be removed - references non-existent post' as reason
FROM group_conversations gc
LEFT JOIN all_posts ap ON ap.id = gc.event_id
WHERE ap.id IS NULL;

-- STEP 2: Identify orphaned message participants (run this first to see what will be deleted)
WITH all_posts AS (
    SELECT id FROM posts
    UNION
    SELECT original_post_id::text FROM trash
)
SELECT 
    'ORPHANED MESSAGE PARTICIPANTS TO DELETE' as action,
    mp.event_id,
    mp.user_id,
    mp.joined_at,
    'Will be removed - references non-existent post' as reason
FROM message_participants mp
LEFT JOIN all_posts ap ON ap.id = mp.event_id
WHERE ap.id IS NULL;

-- STEP 3: Identify duplicate unified participants (run this first to see what will be deleted)
SELECT 
    'DUPLICATE UNIFIED PARTICIPANTS TO DELETE' as action,
    conversation_id,
    user_id,
    COUNT(*) as duplicate_count,
    array_agg(id) as ids,
    'Will keep the oldest entry, delete newer duplicates' as reason
FROM unified_participants 
WHERE conversation_type = 'group'
GROUP BY conversation_id, user_id
HAVING COUNT(*) > 1;

-- STEP 4: Identify duplicate message participants (run this first to see what will be deleted)
SELECT 
    'DUPLICATE MESSAGE PARTICIPANTS TO DELETE' as action,
    event_id,
    user_id,
    COUNT(*) as duplicate_count,
    array_agg(id) as ids,
    'Will keep the oldest entry, delete newer duplicates' as reason
FROM message_participants 
GROUP BY event_id, user_id
HAVING COUNT(*) > 1;

-- =============================================================================
-- CLEANUP ACTIONS (UNCOMMENT AND RUN AFTER REVIEWING ABOVE RESULTS)
-- =============================================================================

-- STEP 5: Delete orphaned unified participants
/*
DELETE FROM unified_participants 
WHERE conversation_type = 'group' 
AND conversation_id IN (
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
    SELECT gc.conversation_id
    FROM group_conversations gc
    LEFT JOIN all_posts ap ON ap.id = gc.event_id
    WHERE ap.id IS NULL
);
*/

-- STEP 6: Delete orphaned message participants
/*
DELETE FROM message_participants 
WHERE event_id NOT IN (
    SELECT id FROM posts
    UNION
    SELECT original_post_id::text FROM trash
);
*/

-- STEP 7: Delete orphaned unified messages
/*
DELETE FROM unified_messages 
WHERE conversation_id LIKE 'group_%'
AND conversation_id NOT IN (
    SELECT DISTINCT conversation_id 
    FROM unified_participants 
    WHERE conversation_type = 'group'
);
*/

-- STEP 8: Delete orphaned messages (old system)
/*
DELETE FROM messages 
WHERE event_id NOT IN (
    SELECT id FROM posts
    UNION
    SELECT original_post_id::text FROM trash
);
*/

-- STEP 9: Remove duplicate unified participants (keep oldest)
/*
DELETE FROM unified_participants 
WHERE id IN (
    SELECT up.id
    FROM unified_participants up
    JOIN (
        SELECT 
            conversation_id, 
            user_id, 
            MIN(joined_at) as min_joined_at
        FROM unified_participants 
        WHERE conversation_type = 'group'
        GROUP BY conversation_id, user_id
        HAVING COUNT(*) > 1
    ) duplicates ON up.conversation_id = duplicates.conversation_id 
                 AND up.user_id = duplicates.user_id
                 AND up.joined_at > duplicates.min_joined_at
);
*/

-- STEP 10: Remove duplicate message participants (keep oldest)
/*
DELETE FROM message_participants 
WHERE id IN (
    SELECT mp.id
    FROM message_participants mp
    JOIN (
        SELECT 
            event_id, 
            user_id, 
            MIN(joined_at) as min_joined_at
        FROM message_participants 
        GROUP BY event_id, user_id
        HAVING COUNT(*) > 1
    ) duplicates ON mp.event_id = duplicates.event_id 
                 AND mp.user_id = duplicates.user_id
                 AND mp.joined_at > duplicates.min_joined_at
);
*/

-- =============================================================================
-- VERIFICATION QUERIES (run after cleanup)
-- =============================================================================

-- Verify no orphaned group chats remain
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
    'REMAINING ORPHANED GROUP CHATS' as status,
    COUNT(*) as count
FROM group_conversations gc
LEFT JOIN all_posts ap ON ap.id = gc.event_id
WHERE ap.id IS NULL;

-- Verify no duplicate participants remain
SELECT 
    'REMAINING DUPLICATES' as status,
    'unified_participants' as table_name,
    COUNT(*) as duplicate_count
FROM (
    SELECT conversation_id, user_id
    FROM unified_participants 
    WHERE conversation_type = 'group'
    GROUP BY conversation_id, user_id
    HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 
    'REMAINING DUPLICATES' as status,
    'message_participants' as table_name,
    COUNT(*) as duplicate_count
FROM (
    SELECT event_id, user_id
    FROM message_participants 
    GROUP BY event_id, user_id
    HAVING COUNT(*) > 1
) duplicates;
