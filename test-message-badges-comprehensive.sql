-- COMPREHENSIVE TEST FOR MESSAGE BADGES
-- This will test the message badge system for both promoters and talents
-- Run this in your Supabase SQL editor

-- 1. CHECK ALL USERS AND THEIR PARTICIPATION STATUS
SELECT 'ALL USERS PARTICIPATION STATUS' as section;
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    COUNT(up.conversation_id) as conversation_count,
    COUNT(CASE WHEN up.conversation_type = 'private' THEN 1 END) as private_conversations,
    COUNT(CASE WHEN up.conversation_type = 'group' THEN 1 END) as group_conversations
FROM profiles p
LEFT JOIN unified_participants up ON p.id = up.user_id
WHERE p.role IN ('promoter', 'talent')
GROUP BY p.id, p.full_name, p.email, p.role
ORDER BY p.role, p.full_name;

-- 2. CHECK UNREAD MESSAGE COUNTS FOR EACH USER
SELECT 'UNREAD MESSAGE COUNTS BY USER' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    up.conversation_id,
    up.conversation_type,
    up.last_read_at,
    COUNT(um.id) as unread_count,
    MAX(um.created_at) as latest_message_time
FROM profiles p
JOIN unified_participants up ON p.id = up.user_id
LEFT JOIN unified_messages um ON up.conversation_id = um.conversation_id
WHERE p.role IN ('promoter', 'talent')
AND um.sender_id != up.user_id  -- Don't count messages sent by the user themselves
AND um.created_at > COALESCE(up.last_read_at, '1970-01-01')
GROUP BY p.id, p.full_name, p.email, p.role, up.conversation_id, up.conversation_type, up.last_read_at
ORDER BY unread_count DESC;

-- 3. TOTAL BADGE COUNT FOR EACH USER (THIS IS WHAT THE BADGE SHOULD SHOW)
SELECT 'TOTAL BADGE COUNT FOR EACH USER' as section;
SELECT 
    p.full_name,
    p.email,
    p.role,
    SUM(unread_counts.unread_count) as total_badge_count
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
GROUP BY p.id, p.full_name, p.email, p.role
HAVING SUM(unread_counts.unread_count) > 0
ORDER BY total_badge_count DESC;

-- 4. CHECK RECENT MESSAGE ACTIVITY
SELECT 'RECENT MESSAGE ACTIVITY (LAST 2 HOURS)' as section;
SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    sender.full_name as sender_name,
    sender.role as sender_role,
    receiver.full_name as receiver_name,
    receiver.role as receiver_role
FROM unified_messages um
LEFT JOIN profiles sender ON um.sender_id = sender.id
LEFT JOIN unified_participants up ON um.conversation_id = up.conversation_id
LEFT JOIN profiles receiver ON up.user_id = receiver.id
WHERE um.created_at > NOW() - INTERVAL '2 hours'
AND um.sender_id != up.user_id  -- Only messages sent to others
ORDER BY um.created_at DESC;

-- 5. VERIFY BADGE LOGIC FOR SPECIFIC TEST CASE
SELECT 'BADGE LOGIC VERIFICATION' as section;
SELECT 
    'Keith Carols should see badges for messages sent TO him' as test_case,
    COUNT(um.id) as messages_sent_to_keith,
    'Talent should see badges for messages sent TO them' as test_case_2,
    COUNT(um2.id) as messages_sent_to_talents
FROM unified_messages um
JOIN unified_participants up ON um.conversation_id = up.conversation_id
JOIN profiles p ON up.user_id = p.id
LEFT JOIN unified_messages um2 ON um2.conversation_id = up.conversation_id
WHERE p.email LIKE '%keith%' OR p.full_name LIKE '%keith%'
AND um.sender_id != p.id  -- Messages sent TO Keith, not BY Keith
AND um.created_at > COALESCE(up.last_read_at, '1970-01-01');
