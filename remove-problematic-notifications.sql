-- REMOVE ALL PROBLEMATIC NOTIFICATIONS
-- This will clean up all offer notifications with NULL promoter_id or event_id
-- Run this in your Supabase SQL editor

-- First, let's see what we're about to delete
SELECT 'NOTIFICATIONS TO DELETE' as section;

SELECT 
    id,
    LEFT(message, 50) as message_preview,
    promoter_id,
    event_id,
    created_at
FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL)
ORDER BY created_at DESC;

-- Delete all problematic notifications
DELETE FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL);

-- Verify cleanup was successful
SELECT 'AFTER CLEANUP - REMAINING NOTIFICATIONS' as section;

SELECT 
    id,
    type,
    title,
    LEFT(message, 50) as message_preview,
    promoter_id,
    event_id,
    event_title,
    offer_amount,
    created_at
FROM notifications 
WHERE type = 'offer_received'
ORDER BY created_at DESC;

-- Final count
SELECT 'FINAL COUNT' as section;

SELECT COUNT(*) as remaining_offer_notifications
FROM notifications 
WHERE type = 'offer_received';

SELECT 'SUCCESS: All problematic notifications have been removed!' as result;






