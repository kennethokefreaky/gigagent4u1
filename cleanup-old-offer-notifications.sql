-- CLEANUP OLD OFFER NOTIFICATIONS
-- This script removes old offer notifications that don't have promoter_id/event_id
-- Run this in your Supabase SQL editor

-- 1. First, let's see what we're dealing with
SELECT 'BEFORE CLEANUP - OLD OFFER NOTIFICATIONS' as section;

SELECT 
    id,
    type,
    title,
    message,
    promoter_id,
    event_id,
    event_title,
    created_at
FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL)
ORDER BY created_at DESC;

-- 2. Count how many problematic notifications we have
SELECT 'COUNT OF PROBLEMATIC NOTIFICATIONS' as section;

SELECT COUNT(*) as problematic_count
FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL);

-- 3. Delete old offer notifications that don't have proper IDs
-- This will clean up the problematic notifications
DELETE FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL);

-- 4. Verify the cleanup
SELECT 'AFTER CLEANUP - REMAINING OFFER NOTIFICATIONS' as section;

SELECT 
    id,
    type,
    title,
    message,
    promoter_id,
    event_id,
    event_title,
    created_at
FROM notifications 
WHERE type = 'offer_received'
ORDER BY created_at DESC;

-- 5. Show final count
SELECT 'FINAL COUNT OF OFFER NOTIFICATIONS' as section;

SELECT COUNT(*) as remaining_count
FROM notifications 
WHERE type = 'offer_received';

