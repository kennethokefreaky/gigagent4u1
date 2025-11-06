-- FIX UNIFIED MESSAGING FUNCTIONS - FINAL VERSION
-- This script fixes the ambiguous column reference errors
-- Run this script in your Supabase SQL editor

-- 0. DROP EXISTING FUNCTIONS FIRST
DROP FUNCTION IF EXISTS get_unified_messages(TEXT, UUID);
DROP FUNCTION IF EXISTS send_unified_message(TEXT, TEXT, UUID, TEXT);

-- 1. CREATE get_unified_messages FUNCTION WITH PROPER TABLE ALIASES
CREATE OR REPLACE FUNCTION get_unified_messages(
  conversation_id_param TEXT,
  user_id_param UUID
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
BEGIN
  -- Check if user is a participant with proper table alias
  IF NOT EXISTS (
    SELECT 1 FROM unified_participants up
    WHERE up.conversation_id = conversation_id_param 
    AND up.user_id = user_id_param
  ) THEN
    RETURN;
  END IF;

  -- Return messages with sender info using proper table aliases
  RETURN QUERY
  SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    um.updated_at,
    COALESCE(p.full_name, SPLIT_PART(p.email, '@', 1), 'Unknown') as sender_name,
    p.profile_image_url as sender_avatar
  FROM unified_messages um
  LEFT JOIN profiles p ON um.sender_id = p.id
  WHERE um.conversation_id = conversation_id_param
  ORDER BY um.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CREATE send_unified_message FUNCTION WITH PROPER TABLE ALIASES
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
  -- Check if sender is a participant with proper table alias
  IF NOT EXISTS (
    SELECT 1 FROM unified_participants up
    WHERE up.conversation_id = conversation_id_param 
    AND up.user_id = sender_id_param
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

  -- Get sender info for the response
  SELECT 
    COALESCE(full_name, SPLIT_PART(email, '@', 1), 'Unknown'),
    profile_image_url
  INTO sender_name, sender_avatar
  FROM profiles 
  WHERE id = sender_id_param;

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
  WHERE um.id = new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_unified_messages TO authenticated;
GRANT EXECUTE ON FUNCTION send_unified_message TO authenticated;

-- 4. VERIFY FUNCTIONS EXIST
SELECT 
  routine_name,
  'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_unified_messages', 'send_unified_message');
