-- TEST THE SEND_UNIFIED_MESSAGE FUNCTION
-- This script tests if the function actually works
-- Run this in your Supabase SQL editor

-- First, let's see what data we have
SELECT 'unified_participants data:' as info;
SELECT conversation_id, user_id, conversation_type FROM unified_participants LIMIT 5;

SELECT 'unified_messages data:' as info;
SELECT conversation_id, sender_id, message_text FROM unified_messages LIMIT 5;

-- Test the function with a real conversation
-- Replace these with actual values from your data
SELECT 'Testing send_unified_message function:' as info;

-- This will show us if the function works or what error we get
SELECT * FROM send_unified_message(
  'group_a55d650a-5c20-4e47-b600-a77d9d57df50',  -- conversation_id
  'group',                                        -- conversation_type  
  '94854daa-66c8-406b-bbb4-d66f989051cc'::UUID,  -- sender_id
  'Test message from SQL'                         -- message_text
);
