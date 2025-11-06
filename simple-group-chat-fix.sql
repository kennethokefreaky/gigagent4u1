-- SIMPLE GROUP CHAT FIX - BYPASS ALL COMPLEX FUNCTIONS
-- This creates a simple, working group chat system
-- Run this in your Supabase SQL editor

-- 1. DROP ALL PROBLEMATIC FUNCTIONS
DROP FUNCTION IF EXISTS send_unified_message(TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS get_unified_messages(TEXT, UUID);

-- 2. CREATE SIMPLE WORKING FUNCTIONS
CREATE OR REPLACE FUNCTION send_group_message(
  event_id_param TEXT,
  sender_id_param UUID,
  message_text_param TEXT
)
RETURNS TABLE (
  id UUID,
  event_id TEXT,
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
  -- Insert message directly into unified_messages
  INSERT INTO unified_messages (
    conversation_id,
    conversation_type,
    sender_id,
    message_text
  ) VALUES (
    'group_' || event_id_param,
    'group',
    sender_id_param,
    message_text_param
  ) RETURNING id INTO new_message_id;

  -- Get sender info
  SELECT 
    COALESCE(full_name, SPLIT_PART(email, '@', 1), 'Unknown'),
    profile_image_url
  INTO sender_name, sender_avatar
  FROM profiles 
  WHERE profiles.id = sender_id_param;

  -- Return the message
  RETURN QUERY
  SELECT 
    um.id,
    event_id_param,
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

CREATE OR REPLACE FUNCTION get_group_messages(
  event_id_param TEXT,
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  event_id TEXT,
  sender_id UUID,
  message_text TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  sender_name TEXT,
  sender_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.id,
    event_id_param,
    um.sender_id,
    um.message_text,
    um.created_at,
    um.updated_at,
    COALESCE(p.full_name, SPLIT_PART(p.email, '@', 1), 'Unknown'),
    p.profile_image_url
  FROM unified_messages um
  LEFT JOIN profiles p ON um.sender_id = p.id
  WHERE um.conversation_id = 'group_' || event_id_param
  ORDER BY um.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION send_group_message TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_messages TO authenticated;
