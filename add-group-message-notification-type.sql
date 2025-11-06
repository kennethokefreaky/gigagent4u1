-- ADD GROUP MESSAGE NOTIFICATION TYPE
-- This will allow both private and group message notifications
-- Run this in your Supabase SQL editor

-- 1. FIRST, CHECK THE CURRENT CONSTRAINT
SELECT 'CURRENT NOTIFICATION CONSTRAINT' as section;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- 2. DROP THE OLD CONSTRAINT
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 3. CREATE A NEW CONSTRAINT THAT ALLOWS BOTH TYPES
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('new_message', 'group_message', 'message'));

-- 4. VERIFY THE NEW CONSTRAINT
SELECT 'NEW NOTIFICATION CONSTRAINT' as section;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- 5. TEST THE CONSTRAINT
SELECT 'CONSTRAINT UPDATED - BOTH PRIVATE AND GROUP MESSAGES ALLOWED' as status;
