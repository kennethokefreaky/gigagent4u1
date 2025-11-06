-- COMPLETE NOTIFICATION FIX
-- This script completely fixes the notification system
-- Run this in your Supabase SQL editor

-- STEP 1: COMPLETE CLEANUP OF ALL PROBLEMATIC NOTIFICATIONS
-- Remove ALL offer_received notifications that don't have proper data
SELECT 'STEP 1: CLEANING UP ALL PROBLEMATIC NOTIFICATIONS' as section;

-- First, let's see what we're about to delete
SELECT 
    COUNT(*) as notifications_to_delete,
    'These notifications will be deleted because they have missing promoter_id or event_id' as reason
FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL);

-- Delete all problematic notifications
DELETE FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL);

-- STEP 2: VERIFY CLEANUP WAS SUCCESSFUL
SELECT 'STEP 2: VERIFICATION - REMAINING NOTIFICATIONS' as section;

SELECT 
    id,
    type,
    title,
    LEFT(message, 60) as message_preview,
    promoter_id,
    event_id,
    event_title,
    offer_amount,
    created_at
FROM notifications 
WHERE type = 'offer_received'
ORDER BY created_at DESC;

-- STEP 3: FINAL COUNT VERIFICATION
SELECT 'STEP 3: FINAL COUNT VERIFICATION' as section;

SELECT 
    COUNT(*) as total_offer_notifications,
    COUNT(CASE WHEN promoter_id IS NULL OR event_id IS NULL THEN 1 END) as problematic_count,
    COUNT(CASE WHEN promoter_id IS NOT NULL AND event_id IS NOT NULL THEN 1 END) as complete_count
FROM notifications 
WHERE type = 'offer_received';

-- STEP 4: TABLE STRUCTURE VERIFICATION
SELECT 'STEP 4: TABLE STRUCTURE VERIFICATION' as section;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
AND column_name IN ('promoter_id', 'event_id', 'event_title', 'offer_amount')
ORDER BY column_name;

-- STEP 5: SUCCESS MESSAGE
SELECT 'SUCCESS: All problematic notifications have been removed!' as result;






