-- CLEANUP OLD MESSAGING TABLES
-- Run this AFTER confirming the unified system is working correctly
-- This will remove the old messaging tables to prevent conflicts

-- 1. DROP OLD PRIVATE CHAT TABLES
-- Drop triggers first
DROP TRIGGER IF EXISTS private_chat_message_notification ON private_chat_messages;
DROP TRIGGER IF EXISTS private_chat_participant_notification ON private_chat_participants;

-- Drop functions
DROP FUNCTION IF EXISTS get_private_chat_messages(TEXT, UUID);
DROP FUNCTION IF EXISTS send_private_chat_message(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS join_private_chat(TEXT, UUID);

-- Drop policies
DROP POLICY IF EXISTS "Users can view messages from their private chats" ON private_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their private chats" ON private_chat_messages;
DROP POLICY IF EXISTS "Users can view their private chat participants" ON private_chat_participants;
DROP POLICY IF EXISTS "Users can join private chats" ON private_chat_participants;
DROP POLICY IF EXISTS "Users can update their private chat status" ON private_chat_participants;

-- Drop tables
DROP TABLE IF EXISTS private_chat_messages CASCADE;
DROP TABLE IF EXISTS private_chat_participants CASCADE;

-- 2. DROP OLD GROUP CHAT TABLES
-- Drop triggers first
DROP TRIGGER IF EXISTS group_chat_message_notification ON messages;
DROP TRIGGER IF EXISTS group_chat_participant_notification ON message_participants;

-- Drop functions
DROP FUNCTION IF EXISTS get_group_chat_messages(UUID, UUID);
DROP FUNCTION IF EXISTS send_group_chat_message(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS join_group_chat(UUID, UUID);

-- Drop policies
DROP POLICY IF EXISTS "Users can view messages for their events" ON messages;
DROP POLICY IF EXISTS "Users can send messages for their events" ON messages;
DROP POLICY IF EXISTS "Users can view participants in their events" ON message_participants;
DROP POLICY IF EXISTS "Users can join events they're invited to" ON message_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON message_participants;

-- Drop tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_participants CASCADE;
DROP TABLE IF EXISTS message_read_status CASCADE;

-- 3. VERIFICATION
SELECT 'Old messaging tables cleaned up successfully!' as status;
SELECT 'Unified messaging system is now the only messaging system.' as note;
