-- FIX UUID TYPE MISMATCH IN SEND_UNIFIED_MESSAGE FUNCTION
-- This script fixes the UUID vs TEXT type mismatch error
-- Run this script in your Supabase SQL editor

-- Drop the existing function first
DROP FUNCTION IF EXISTS send_unified_message(TEXT, TEXT, UUID, TEXT);

-- Create the fixed send_unified_message function with proper type casting
CREATE OR REPLACE FUNCTION send_unified_message(
  conversation_id_param TEXT,
  conversation_type_param TEXT,
  sender_id_param UUID,
  message_text_param TEXT
)
RETURNS TABLE (
  id UUID,
  conversation_id TEXT,
  conversation_type TEXT,
  sender_id UUID,
  message_text TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  sender_name TEXT,
  sender_avatar TEXT
) AS $$
DECLARE
  new_message_id UUID;
  sender_name TEXT;
  sender_avatar TEXT;
BEGIN
  -- Check if sender is a participant with explicit type casting
  IF NOT EXISTS (
    SELECT 1 FROM unified_participants up
    WHERE up.conversation_id = conversation_id_param::TEXT
    AND up.user_id = sender_id_param::UUID
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Insert the message with explicit type casting
  INSERT INTO unified_messages (
    conversation_id,
    conversation_type,
    sender_id,
    message_text
  ) VALUES (
    conversation_id_param::TEXT,
    conversation_type_param::TEXT,
    sender_id_param::UUID,
    message_text_param::TEXT
  ) RETURNING unified_messages.id INTO new_message_id;

  -- Get sender info for the response with explicit type casting
  SELECT 
    COALESCE(full_name, SPLIT_PART(email, '@', 1), 'Unknown'),
    profile_image_url
  INTO sender_name, sender_avatar
  FROM profiles 
  WHERE profiles.id = sender_id_param::UUID;

  -- Return the created message with sender info
  RETURN QUERY
  SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    um.updated_at,
    sender_name,
    sender_avatar
  FROM unified_messages um
  WHERE um.id = new_message_id::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_unified_message TO authenticated;

-- Verify the function exists
SELECT 
  routine_name,
  'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'send_unified_message';
