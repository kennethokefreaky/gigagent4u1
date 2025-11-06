-- COMPREHENSIVE AUDIT AND CLEANUP OF NOTIFICATIONS
-- This script will audit and clean up all problematic notifications
-- Run this in your Supabase SQL editor

-- 1. AUDIT: Check all offer notifications and their data integrity
SELECT 'AUDIT: ALL OFFER NOTIFICATIONS' as section;

SELECT 
    id,
    type,
    title,
    message,
    promoter_id,
    event_id,
    event_title,
    offer_amount,
    created_at,
    CASE 
        WHEN promoter_id IS NULL THEN 'MISSING PROMOTER_ID'
        WHEN event_id IS NULL THEN 'MISSING EVENT_ID'
        ELSE 'COMPLETE'
    END as data_status
FROM notifications 
WHERE type = 'offer_received'
ORDER BY created_at DESC;

-- 2. COUNT: How many problematic notifications exist
SELECT 'COUNT: PROBLEMATIC NOTIFICATIONS' as section;

SELECT 
    COUNT(*) as total_offer_notifications,
    COUNT(CASE WHEN promoter_id IS NULL OR event_id IS NULL THEN 1 END) as problematic_count,
    COUNT(CASE WHEN promoter_id IS NOT NULL AND event_id IS NOT NULL THEN 1 END) as complete_count
FROM notifications 
WHERE type = 'offer_received';

-- 3. DETAILED ANALYSIS: Show which specific notifications are problematic
SELECT 'ANALYSIS: PROBLEMATIC NOTIFICATION DETAILS' as section;

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

-- 4. CLEANUP: Remove all problematic notifications
SELECT 'CLEANUP: REMOVING PROBLEMATIC NOTIFICATIONS' as section;

DELETE FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL);

-- 5. VERIFICATION: Check what remains after cleanup
SELECT 'VERIFICATION: REMAINING NOTIFICATIONS' as section;

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

-- 6. FINAL COUNT: Confirm cleanup was successful
SELECT 'FINAL COUNT: NOTIFICATIONS AFTER CLEANUP' as section;

SELECT 
    COUNT(*) as remaining_offer_notifications,
    COUNT(CASE WHEN promoter_id IS NULL OR event_id IS NULL THEN 1 END) as still_problematic,
    COUNT(CASE WHEN promoter_id IS NOT NULL AND event_id IS NOT NULL THEN 1 END) as complete_notifications
FROM notifications 
WHERE type = 'offer_received';

-- 7. CHECK: Ensure table structure is correct
SELECT 'TABLE STRUCTURE CHECK' as section;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
AND column_name IN ('promoter_id', 'event_id', 'event_title', 'offer_amount')
ORDER BY column_name;

