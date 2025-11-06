-- COMPLETE NOTIFICATION AND OFFER RESET
-- This script will completely reset all offer-related data to ensure clean state
-- Run this in your Supabase SQL editor

-- 1. Check current state before cleanup
SELECT 'BEFORE CLEANUP - CURRENT STATE' as section;

-- Check notifications
SELECT COUNT(*) as total_notifications FROM notifications;
SELECT COUNT(*) as offer_notifications FROM notifications WHERE type = 'offer_received';
SELECT COUNT(*) as accepted_notifications FROM notifications WHERE type = 'offer_accepted';

-- Check candidates
SELECT COUNT(*) as total_candidates FROM candidates;

-- Check group chat participants
SELECT COUNT(*) as message_participants FROM message_participants;
SELECT COUNT(*) as unified_participants FROM unified_participants;

-- Check messages
SELECT COUNT(*) as total_messages FROM messages;

-- 2. Clean up all offer-related notifications
SELECT 'CLEANING UP NOTIFICATIONS' as section;

DELETE FROM notifications 
WHERE type IN ('offer_received', 'offer_accepted', 'offer_edited', 'counter_offer');

-- 3. Clean up all candidates
SELECT 'CLEANING UP CANDIDATES' as section;

DELETE FROM candidates;

-- 4. Clean up all group chat participants
SELECT 'CLEANING UP GROUP CHAT PARTICIPANTS' as section;

DELETE FROM message_participants;
DELETE FROM unified_participants;

-- 5. Clean up all messages
SELECT 'CLEANING UP MESSAGES' as section;

DELETE FROM messages;

-- 6. Clean up applications
SELECT 'CLEANING UP APPLICATIONS' as section;

DELETE FROM applications;

-- 7. Verify cleanup was successful
SELECT 'AFTER CLEANUP - VERIFICATION' as section;

SELECT COUNT(*) as remaining_notifications FROM notifications;
SELECT COUNT(*) as remaining_candidates FROM candidates;
SELECT COUNT(*) as remaining_message_participants FROM message_participants;
SELECT COUNT(*) as remaining_unified_participants FROM unified_participants;
SELECT COUNT(*) as remaining_messages FROM messages;
SELECT COUNT(*) as remaining_applications FROM applications;

-- 8. Final success message
SELECT 'SUCCESS: Complete notification and offer reset completed!' as result;

