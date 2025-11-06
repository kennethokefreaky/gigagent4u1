-- SIMPLE FIX FOR SEND_UNIFIED_MESSAGE FUNCTION
-- Run this in your Supabase SQL editor

DROP FUNCTION IF EXISTS send_unified_message(TEXT, TEXT, UUID, TEXT);

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
  -- Check if sender is a participant
  IF NOT EXISTS (
    SELECT 1 FROM unified_participants 
    WHERE conversation_id = conversation_id_param 
    AND user_id = sender_id_param
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Insert the message
  INSERT INTO unified_messages (
    conversation_id,
    conversation_type,
    sender_id,
    message_text
  ) VALUES (
    conversation_id_param,
    conversation_type_param,
    sender_id_param,
    message_text_param
  ) RETURNING id INTO new_message_id;

  -- Get sender info
  SELECT 
    COALESCE(full_name, SPLIT_PART(email, '@', 1), 'Unknown'),
    profile_image_url
  INTO sender_name, sender_avatar
  FROM profiles 
  WHERE id = sender_id_param;

  -- Return the created message
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
  WHERE um.id = new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_unified_message TO authenticated;
