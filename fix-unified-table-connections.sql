-- FIX UNIFIED TABLE CONNECTIONS
-- This will properly connect unified tables to profiles
-- Run this in your Supabase SQL editor

-- 1. CHECK CURRENT TABLE STRUCTURE
SELECT 'CURRENT UNIFIED_PARTICIPANTS STRUCTURE' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'unified_participants'
ORDER BY ordinal_position;

-- 2. CHECK CURRENT UNIFIED_MESSAGES STRUCTURE  
SELECT 'CURRENT UNIFIED_MESSAGES STRUCTURE' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'unified_messages'
ORDER BY ordinal_position;

-- 3. CHECK IF FOREIGN KEYS EXIST
SELECT 'EXISTING FOREIGN KEYS' as section;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('unified_participants', 'unified_messages');

-- 4. ADD FOREIGN KEY TO UNIFIED_PARTICIPANTS
SELECT 'ADDING FOREIGN KEY TO UNIFIED_PARTICIPANTS' as section;
ALTER TABLE unified_participants 
ADD CONSTRAINT fk_unified_participants_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. ADD FOREIGN KEY TO UNIFIED_MESSAGES
SELECT 'ADDING FOREIGN KEY TO UNIFIED_MESSAGES' as section;
ALTER TABLE unified_messages 
ADD CONSTRAINT fk_unified_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. VERIFY CONNECTIONS WORK
SELECT 'TESTING CONNECTIONS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    p.full_name,
    p.email,
    p.role
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE p.email = 'keithcarols@gmail.com'
LIMIT 5;
