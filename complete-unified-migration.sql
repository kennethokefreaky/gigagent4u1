-- COMPLETE UNIFIED MESSAGING MIGRATION
-- This script migrates everything to the unified messaging system
-- Run this script in your Supabase SQL editor

-- 1. MIGRATE EXISTING PRIVATE CHAT DATA TO UNIFIED SYSTEM
-- First, migrate all private chat participants
INSERT INTO unified_participants (conversation_id, conversation_type, user_id, joined_at, last_read_at)
SELECT 
  CONCAT('private_', chat_id) as conversation_id,
  'private' as conversation_type,
  user_id,
  joined_at,
  last_read_at
FROM private_chat_participants
WHERE NOT EXISTS (
  SELECT 1 FROM unified_participants up 
  WHERE up.conversation_id = CONCAT('private_', private_chat_participants.chat_id)
  AND up.user_id = private_chat_participants.user_id
);

-- Migrate all private chat messages
INSERT INTO unified_messages (conversation_id, conversation_type, sender_id, message_text, created_at, updated_at)
SELECT 
  CONCAT('private_', chat_id) as conversation_id,
  'private' as conversation_type,
  sender_id,
  message_text,
  created_at,
  updated_at
FROM private_chat_messages
WHERE NOT EXISTS (
  SELECT 1 FROM unified_messages um 
  WHERE um.conversation_id = CONCAT('private_', private_chat_messages.chat_id)
  AND um.sender_id = private_chat_messages.sender_id
  AND um.message_text = private_chat_messages.message_text
  AND um.created_at = private_chat_messages.created_at
);

-- 2. MIGRATE EXISTING GROUP CHAT DATA TO UNIFIED SYSTEM
-- Migrate group chat participants from message_participants to unified_participants
INSERT INTO unified_participants (conversation_id, conversation_type, user_id, joined_at, last_read_at)
SELECT 
  CONCAT('group_', event_id) as conversation_id,
  'group' as conversation_type,
  user_id,
  joined_at,
  last_read_at
FROM message_participants
WHERE NOT EXISTS (
  SELECT 1 FROM unified_participants up 
  WHERE up.conversation_id = CONCAT('group_', message_participants.event_id)
  AND up.user_id = message_participants.user_id
);

-- Migrate group chat messages from messages to unified_messages
INSERT INTO unified_messages (conversation_id, conversation_type, sender_id, message_text, created_at, updated_at)
SELECT 
  CONCAT('group_', event_id) as conversation_id,
  'group' as conversation_type,
  sender_id,
  message_text,
  created_at,
  updated_at
FROM messages
WHERE NOT EXISTS (
  SELECT 1 FROM unified_messages um 
  WHERE um.conversation_id = CONCAT('group_', messages.event_id)
  AND um.sender_id = messages.sender_id
  AND um.message_text = messages.message_text
  AND um.created_at = messages.created_at
);

-- 3. CREATE UNIFIED MESSAGING FUNCTIONS
-- Function to get all messages for a conversation (both private and group)
CREATE OR REPLACE FUNCTION get_unified_messages(conversation_id_param TEXT, user_id_param UUID)
RETURNS TABLE (
  id UUID,
  conversation_id TEXT,
  conversation_type TEXT,
  sender_id UUID,
  message_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  sender_name TEXT,
  sender_avatar TEXT
) AS $$
BEGIN
  -- Check if user is a participant in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM unified_participants 
    WHERE conversation_id = conversation_id_param AND user_id = user_id_param
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Return messages with sender info
  RETURN QUERY
  SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    um.updated_at,
    p.full_name as sender_name,
    p.profile_image_url as sender_avatar
  FROM unified_messages um
  LEFT JOIN profiles p ON um.sender_id = p.id
  WHERE um.conversation_id = conversation_id_param
  ORDER BY um.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send unified message
CREATE OR REPLACE FUNCTION send_unified_message(
  conversation_id_param TEXT,
  conversation_type_param TEXT,
  sender_id_param UUID,
  message_text_param TEXT
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Check if sender is a participant in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM unified_participants 
    WHERE conversation_id = conversation_id_param AND user_id = sender_id_param
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Insert the message
  INSERT INTO unified_messages (conversation_id, conversation_type, sender_id, message_text)
  VALUES (conversation_id_param, conversation_type_param, sender_id_param, message_text_param)
  RETURNING id INTO message_id;

  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join a conversation
CREATE OR REPLACE FUNCTION join_unified_conversation(
  conversation_id_param TEXT,
  conversation_type_param TEXT,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert participant if not already exists
  INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
  VALUES (conversation_id_param, conversation_type_param, user_id_param)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE UNIFIED RLS POLICIES
-- Drop old policies
DROP POLICY IF EXISTS "unified_messages_view" ON unified_messages;
DROP POLICY IF EXISTS "unified_participants_view" ON unified_participants;

-- Create new unified policies
CREATE POLICY "unified_messages_participants" ON unified_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT conversation_id FROM unified_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "unified_participants_own" ON unified_participants
  FOR ALL USING (user_id = auth.uid());

-- 5. CREATE NOTIFICATION TRIGGER FOR UNIFIED MESSAGES
CREATE OR REPLACE FUNCTION create_unified_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name
  FROM profiles 
  WHERE id = NEW.sender_id;
  
  -- Create notifications for all other participants
  FOR participant_record IN 
    SELECT user_id FROM unified_participants 
    WHERE conversation_id = NEW.conversation_id 
    AND user_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      participant_record.user_id,
      'message',
      CASE 
        WHEN NEW.conversation_type = 'private' THEN 'New Private Message'
        ELSE 'New Group Message'
      END,
      COALESCE(sender_name, 'Someone') || ': ' || NEW.message_text,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'conversation_type', NEW.conversation_type,
        'sender_id', NEW.sender_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS unified_message_notification ON unified_messages;
CREATE TRIGGER unified_message_notification
  AFTER INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_unified_message_notification();

-- 6. VERIFICATION QUERIES
-- Check migration results
SELECT 'Private chat participants migrated:' as status, COUNT(*) as count FROM unified_participants WHERE conversation_type = 'private';
SELECT 'Private chat messages migrated:' as status, COUNT(*) as count FROM unified_messages WHERE conversation_type = 'private';
SELECT 'Group chat participants migrated:' as status, COUNT(*) as count FROM unified_participants WHERE conversation_type = 'group';
SELECT 'Group chat messages migrated:' as status, COUNT(*) as count FROM unified_messages WHERE conversation_type = 'group';

-- 7. SUCCESS MESSAGE
SELECT 'Unified messaging migration completed successfully!' as status;
