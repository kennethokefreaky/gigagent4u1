-- Cleanup Duplicate Group Chats
-- This script removes duplicate group chat entries to fix the messages page issue

-- STEP 1: Review what will be deleted (run this first)
SELECT 
    'DUPLICATES TO REMOVE (UNIFIED)' as action,
    conversation_id,
    user_id,
    joined_at,
    last_read_at,
    'Will keep oldest entry, delete newer duplicates' as reason
FROM unified_participants up
WHERE conversation_type = 'group'
AND id IN (
    SELECT up2.id
    FROM unified_participants up2
    JOIN (
        SELECT 
            conversation_id, 
            user_id, 
            MIN(joined_at) as min_joined_at
        FROM unified_participants 
        WHERE conversation_type = 'group'
        GROUP BY conversation_id, user_id
        HAVING COUNT(*) > 1
    ) duplicates ON up2.conversation_id = duplicates.conversation_id 
                 AND up2.user_id = duplicates.user_id
                 AND up2.joined_at > duplicates.min_joined_at
)
ORDER BY conversation_id, user_id, joined_at;

-- STEP 2: Review duplicates in message_participants (run this first)
SELECT 
    'DUPLICATES TO REMOVE (MESSAGE)' as action,
    event_id,
    user_id,
    joined_at,
    last_read_at,
    'Will keep oldest entry, delete newer duplicates' as reason
FROM message_participants mp
WHERE id IN (
    SELECT mp2.id
    FROM message_participants mp2
    JOIN (
        SELECT 
            event_id, 
            user_id, 
            MIN(joined_at) as min_joined_at
        FROM message_participants 
        GROUP BY event_id, user_id
        HAVING COUNT(*) > 1
    ) duplicates ON mp2.event_id = duplicates.event_id 
                 AND mp2.user_id = duplicates.user_id
                 AND mp2.joined_at > duplicates.min_joined_at
)
ORDER BY event_id, user_id, joined_at;

-- =============================================================================
-- CLEANUP ACTIONS (UNCOMMENT AND RUN AFTER REVIEWING ABOVE RESULTS)
-- =============================================================================

-- STEP 3: Remove duplicate unified participants (keep oldest)

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

-- STEP 4: Remove duplicate message participants (keep oldest)

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

-- Verify no duplicates remain in unified_participants
SELECT 
    'REMAINING DUPLICATES (UNIFIED)' as status,
    conversation_id,
    user_id,
    COUNT(*) as duplicate_count
FROM unified_participants 
WHERE conversation_type = 'group'
GROUP BY conversation_id, user_id
HAVING COUNT(*) > 1;

-- Verify no duplicates remain in message_participants
SELECT 
    'REMAINING DUPLICATES (MESSAGE)' as status,
    event_id,
    user_id,
    COUNT(*) as duplicate_count
FROM message_participants 
GROUP BY event_id, user_id
HAVING COUNT(*) > 1;

-- Final count comparison
SELECT 
    'FINAL COUNTS' as report_type,
    (SELECT COUNT(DISTINCT conversation_id) FROM unified_participants WHERE conversation_type = 'group') as total_unified_groups,
    (SELECT COUNT(DISTINCT event_id) FROM message_participants) as total_message_groups,
    (SELECT COUNT(*) FROM unified_participants WHERE conversation_type = 'group') as total_unified_participants,
    (SELECT COUNT(*) FROM message_participants) as total_message_participants;
