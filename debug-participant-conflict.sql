-- DEBUG PARTICIPANT CONFLICT
-- This script checks which tables actually have the user as a participant
-- Run this in your Supabase SQL editor

-- 1. CHECK WHAT TABLES EXIST
SELECT 'EXISTING TABLES AUDIT' as section;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%participant%' OR table_name LIKE '%message%')
ORDER BY table_name;

-- 2. CHECK PARTICIPANTS IN EACH TABLE FOR A SPECIFIC EVENT
-- Replace 'YOUR_EVENT_ID' with the actual event ID you're testing
-- Replace 'YOUR_USER_ID' with the actual user ID you're testing
-- Example: 'a55d650a-5c20-4e47-b600-a77d9d57df50' and '94854daa-66c8-406b-bbb4-d66f989051cc'

SELECT 'PARTICIPANT AUDIT FOR EVENT' as section;

-- Check unified_participants
SELECT 'unified_participants' as table_name, COUNT(*) as participant_count
FROM unified_participants 
WHERE conversation_id = 'group_YOUR_EVENT_ID'

UNION ALL

-- Check message_participants  
SELECT 'message_participants' as table_name, COUNT(*) as participant_count
FROM message_participants 
WHERE event_id = 'YOUR_EVENT_ID'

UNION ALL

-- Check group_participants (if exists)
SELECT 'group_participants' as table_name, COUNT(*) as participant_count
FROM group_participants 
WHERE event_id = 'YOUR_EVENT_ID';

-- 3. CHECK SPECIFIC USER PARTICIPATION
SELECT 'USER PARTICIPATION AUDIT' as section;

-- Check if user is in unified_participants
SELECT 'unified_participants' as table_name, 
       CASE WHEN user_id IS NOT NULL THEN 'FOUND' ELSE 'NOT FOUND' END as status
FROM unified_participants 
WHERE conversation_id = 'group_YOUR_EVENT_ID' 
AND user_id = 'YOUR_USER_ID'

UNION ALL

-- Check if user is in message_participants
SELECT 'message_participants' as table_name,
       CASE WHEN user_id IS NOT NULL THEN 'FOUND' ELSE 'NOT FOUND' END as status  
FROM message_participants 
WHERE event_id = 'YOUR_EVENT_ID' 
AND user_id = 'YOUR_USER_ID';

-- 4. SHOW ALL PARTICIPANTS FOR THE EVENT
SELECT 'ALL PARTICIPANTS FOR EVENT' as section;

-- Show unified_participants
SELECT 'unified_participants' as source, user_id, conversation_id
FROM unified_participants 
WHERE conversation_id = 'group_YOUR_EVENT_ID'

UNION ALL

-- Show message_participants
SELECT 'message_participants' as source, user_id, event_id::text as conversation_id
FROM message_participants 
WHERE event_id = 'YOUR_EVENT_ID';
