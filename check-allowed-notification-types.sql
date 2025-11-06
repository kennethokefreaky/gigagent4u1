-- CHECK WHAT NOTIFICATION TYPES ARE ALLOWED
-- This will show us what types we can use for notifications
-- Run this in your Supabase SQL editor

-- 1. CHECK THE NOTIFICATION TYPE CONSTRAINT
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- 2. CHECK EXISTING NOTIFICATION TYPES IN THE TABLE
SELECT DISTINCT type, COUNT(*) as count
FROM notifications 
GROUP BY type
ORDER BY type;

-- 3. SHOW SAMPLE NOTIFICATIONS
SELECT type, title, message, created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
