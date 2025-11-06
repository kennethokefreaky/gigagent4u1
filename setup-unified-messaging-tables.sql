-- SETUP UNIFIED MESSAGING SYSTEM
-- This script creates the unified messaging tables and functions
-- Run this script in your Supabase SQL editor FIRST

-- 1. CREATE UNIFIED PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS unified_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('private', 'group')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 2. CREATE UNIFIED MESSAGES TABLE
CREATE TABLE IF NOT EXISTS unified_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('private', 'group')),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_unified_participants_conversation ON unified_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_unified_participants_user ON unified_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_messages_conversation ON unified_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_unified_messages_sender ON unified_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_unified_messages_created_at ON unified_messages(created_at);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE unified_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_messages ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES FOR UNIFIED PARTICIPANTS
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON unified_participants;
CREATE POLICY "Users can view participants in their conversations" ON unified_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    conversation_id IN (
      SELECT conversation_id FROM unified_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert participants in their conversations" ON unified_participants;
CREATE POLICY "Users can insert participants in their conversations" ON unified_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own participant records" ON unified_participants;
CREATE POLICY "Users can update their own participant records" ON unified_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 6. CREATE RLS POLICIES FOR UNIFIED MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON unified_messages;
CREATE POLICY "Users can view messages in their conversations" ON unified_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM unified_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON unified_messages;
CREATE POLICY "Users can insert messages in their conversations" ON unified_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM unified_participants 
      WHERE user_id = auth.uid()
    )
  );

-- 7. CREATE UNIFIED MESSAGING FUNCTIONS
-- Function to get unified messages
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
  -- Check if user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM unified_participants 
    WHERE conversation_id = conversation_id_param 
    AND user_id = user_id_param
  ) THEN
    RETURN;
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
    COALESCE(p.full_name, SPLIT_PART(p.email, '@', 1), 'Unknown') as sender_name,
    p.profile_image_url as sender_avatar
  FROM unified_messages um
  LEFT JOIN profiles p ON um.sender_id = p.id
  WHERE um.conversation_id = conversation_id_param
  ORDER BY um.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send unified messages
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
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  new_message_id UUID;
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

  -- Return the created message
  RETURN QUERY
  SELECT 
    um.id,
    um.conversation_id,
    um.conversation_type,
    um.sender_id,
    um.message_text,
    um.created_at,
    um.updated_at
  FROM unified_messages um
  WHERE um.id = new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREATE UNIFIED NOTIFICATION TRIGGER
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS unified_message_notification ON unified_messages;

-- Create the trigger
CREATE TRIGGER unified_message_notification
  AFTER INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_unified_message_notification();

-- 9. GRANT PERMISSIONS
GRANT ALL ON unified_participants TO authenticated;
GRANT ALL ON unified_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_unified_messages TO authenticated;
GRANT EXECUTE ON FUNCTION send_unified_message TO authenticated;
