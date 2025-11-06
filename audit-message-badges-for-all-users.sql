-- AUDIT MESSAGE BADGES FOR ALL USERS (PROMOTERS & TALENTS)
-- This will check if the message badge system works for both promoters and talents
-- Run this in your Supabase SQL editor

-- 1. CHECK ALL USERS IN UNIFIED PARTICIPANTS
SELECT 'ALL USERS IN UNIFIED PARTICIPANTS' as section;
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
ORDER BY p.role, p.full_name;

-- 2. CHECK UNREAD MESSAGES FOR ALL USERS
SELECT 'UNREAD MESSAGES FOR ALL USERS' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    COUNT(um.id) as unread_count
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE um.sender_id != up.user_id  -- Don't count messages sent by the user themselves
AND um.created_at > COALESCE(up.last_read_at, '1970-01-01')
GROUP BY p.full_name, p.email, p.role, up.conversation_id, up.conversation_type, up.last_read_at
HAVING COUNT(um.id) > 0
ORDER BY unread_count DESC;

-- 3. TOTAL UNREAD COUNT BY USER ROLE
SELECT 'TOTAL UNREAD COUNT BY USER ROLE' as section;
SELECT 
    p.role,
    COUNT(DISTINCT p.id) as user_count,
    SUM(unread_counts.unread_count) as total_unread_messages
FROM profiles p
LEFT JOIN (
    SELECT 
        up.user_id,
        COUNT(um.id) as unread_count
    FROM unified_participants up
    LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    WHERE um.sender_id != up.user_id  -- Don't count messages sent by the user themselves
    AND um.created_at > COALESCE(up.last_read_at, '1970-01-01')
    GROUP BY up.user_id
) unread_counts ON p.id = unread_counts.user_id
WHERE p.role IN ('promoter', 'talent')
GROUP BY p.role;

-- 4. CHECK SPECIFIC USERS WITH UNREAD MESSAGES
SELECT 'USERS WITH UNREAD MESSAGES' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    SUM(unread_counts.unread_count) as total_unread
FROM profiles p
LEFT JOIN (
    SELECT 
        up.user_id,
        COUNT(um.id) as unread_count
    FROM unified_participants up
    LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
    WHERE um.sender_id != up.user_id  -- Don't count messages sent by the user themselves
    AND um.created_at > COALESCE(up.last_read_at, '1970-01-01')
    GROUP BY up.user_id
) unread_counts ON p.id = unread_counts.user_id
WHERE p.role IN ('promoter', 'talent')
AND unread_counts.unread_count > 0
GROUP BY p.full_name, p.email, p.role
ORDER BY total_unread DESC;

-- 5. CHECK RECENT MESSAGES TO VERIFY BADGE LOGIC
SELECT 'RECENT MESSAGES (LAST 24 HOURS)' as section;
SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    sender.full_name as sender_name,
    sender.email as sender_email,
    sender.role as sender_role
FROM unified_messages um
LEFT JOIN profiles sender ON um.sender_id = sender.id
WHERE um.created_at > NOW() - INTERVAL '24 hours'
ORDER BY um.created_at DESC
LIMIT 10;
