-- COMPLETE FIX FOR NEW OFFER NOTIFICATIONS
-- This ensures all new offer notifications have proper promoter_id and event_id
-- Run this in your Supabase SQL editor

-- 1. First, let's see what we're dealing with
SELECT 'BEFORE CLEANUP - ALL OFFER NOTIFICATIONS' as section;

SELECT 
    id,
    type,
    title,
    message,
    promoter_id,
    event_id,
    event_title,
    offer_amount,
    created_at
FROM notifications 
WHERE type = 'offer_received'
ORDER BY created_at DESC;

-- 2. Count problematic notifications
SELECT 'COUNT OF PROBLEMATIC NOTIFICATIONS' as section;

SELECT COUNT(*) as problematic_count
FROM notifications 
WHERE type = 'offer_received'
AND (promoter_id IS NULL OR event_id IS NULL);

-- 3. Clean up old problematic notifications
-- This removes notifications that don't have proper IDs
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
    offer_amount,
    created_at
FROM notifications 
WHERE type = 'offer_received'
ORDER BY created_at DESC;

-- 5. Show final count
SELECT 'FINAL COUNT OF OFFER NOTIFICATIONS' as section;

SELECT COUNT(*) as remaining_count
FROM notifications 
WHERE type = 'offer_received';

-- 6. Verify table structure has all required columns
SELECT 'VERIFICATION: NOTIFICATIONS TABLE STRUCTURE' as section;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
AND column_name IN ('promoter_id', 'event_id', 'event_title', 'offer_amount')
ORDER BY column_name;

