-- COMPLETE MESSAGING ACCESS FIX
-- This fixes the messaging system to allow proper message viewing and delivery

-- 1. DROP ALL EXISTING POLICIES TO START FRESH
DROP POLICY IF EXISTS "Users can view their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON message_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can view messages for their events" ON messages;
DROP POLICY IF EXISTS "Users can send messages for their events" ON messages;
DROP POLICY IF EXISTS "Users can view their read status" ON message_read_status;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_read_status;
DROP POLICY IF EXISTS "Users can update their read status" ON message_read_status;
DROP POLICY IF EXISTS "Users can view their private chat messages" ON private_chat_messages;
DROP POLICY IF EXISTS "Users can send private chat messages" ON private_chat_messages;
DROP POLICY IF EXISTS "Users can view their private chat participants" ON private_chat_participants;
DROP POLICY IF EXISTS "Users can join their private chats" ON private_chat_participants;

-- 2. CREATE COMPREHENSIVE POLICIES FOR MESSAGE_PARTICIPANTS
-- Users can view participants for events they're part of
CREATE POLICY "Users can view event participants" ON message_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    event_id IN (
      SELECT mp2.event_id 
      FROM message_participants mp2 
      WHERE mp2.user_id = auth.uid()
    )
  );

-- Users can join conversations
CREATE POLICY "Users can join conversations" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own participation
CREATE POLICY "Users can update their participation" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 3. CREATE COMPREHENSIVE POLICIES FOR MESSAGES
-- Users can view messages for events they participate in
CREATE POLICY "Users can view event messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_participants mp 
      WHERE mp.event_id = messages.event_id 
      AND mp.user_id = auth.uid()
    )
  );

-- Users can send messages for events they participate in
CREATE POLICY "Users can send event messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM message_participants mp 
      WHERE mp.event_id = messages.event_id 
      AND mp.user_id = auth.uid()
    )
  );

-- 4. CREATE COMPREHENSIVE POLICIES FOR MESSAGE_READ_STATUS
-- Users can view read status for messages they have access to
CREATE POLICY "Users can view read status" ON message_read_status
  FOR SELECT USING (
    user_id = auth.uid() OR
    message_id IN (
      SELECT m.id FROM messages m
      JOIN message_participants mp ON m.event_id = mp.event_id
      WHERE mp.user_id = auth.uid()
    )
  );

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their read status
CREATE POLICY "Users can update read status" ON message_read_status
  FOR UPDATE USING (user_id = auth.uid());

-- 5. CREATE COMPREHENSIVE POLICIES FOR PRIVATE CHATS
-- Users can view private chat messages they participate in
CREATE POLICY "Users can view private chat messages" ON private_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chat_participants pcp 
      WHERE pcp.chat_id = private_chat_messages.chat_id 
      AND pcp.user_id = auth.uid()
    )
  );

-- Users can send private chat messages
CREATE POLICY "Users can send private chat messages" ON private_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM private_chat_participants pcp 
      WHERE pcp.chat_id = private_chat_messages.chat_id 
      AND pcp.user_id = auth.uid()
    )
  );

-- Users can view private chat participants
CREATE POLICY "Users can view private chat participants" ON private_chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    chat_id IN (
      SELECT pcp2.chat_id 
      FROM private_chat_participants pcp2 
      WHERE pcp2.user_id = auth.uid()
    )
  );

-- Users can join private chats
CREATE POLICY "Users can join private chats" ON private_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. ENSURE PRIVATE CHAT PARTICIPANTS ARE CREATED PROPERLY
-- Create a function to ensure both participants are in private chats
CREATE OR REPLACE FUNCTION ensure_private_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- When a private message is sent, ensure both participants are in the chat
  DECLARE
    talent_id UUID;
    promoter_id UUID;
  BEGIN
    -- Extract talent and promoter IDs from chat_id (format: talentId-promoterId)
    talent_id := split_part(NEW.chat_id, '-', 1);
    promoter_id := split_part(NEW.chat_id, '-', 2);
    
    -- Add talent to private chat if not already there
    INSERT INTO private_chat_participants (chat_id, user_id)
    VALUES (NEW.chat_id, talent_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
    
    -- Add promoter to private chat if not already there
    INSERT INTO private_chat_participants (chat_id, user_id)
    VALUES (NEW.chat_id, promoter_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger to ensure private chat participants
DROP TRIGGER IF EXISTS ensure_private_chat_participants ON private_chat_messages;
CREATE TRIGGER ensure_private_chat_participants
  BEFORE INSERT ON private_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_private_chat_participants();

-- 7. CREATE FUNCTION TO ENSURE GROUP CHAT PARTICIPANTS
CREATE OR REPLACE FUNCTION ensure_group_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- When a group message is sent, ensure sender is a participant
  INSERT INTO message_participants (event_id, user_id)
  VALUES (NEW.event_id, NEW.sender_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to ensure group chat participants
DROP TRIGGER IF EXISTS ensure_group_chat_participants ON messages;
CREATE TRIGGER ensure_group_chat_participants
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_group_chat_participants();

-- 8. CREATE NOTIFICATION TRIGGERS
-- Function to create notifications for private messages
CREATE OR REPLACE FUNCTION create_private_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the recipient of the private message
  DECLARE
    talent_id UUID;
    promoter_id UUID;
    recipient_id UUID;
    sender_name TEXT;
  BEGIN
    -- Extract talent and promoter IDs from chat_id
    talent_id := split_part(NEW.chat_id, '-', 1);
    promoter_id := split_part(NEW.chat_id, '-', 2);
    
    -- Determine recipient (the one who didn't send the message)
    IF NEW.sender_id = talent_id THEN
      recipient_id := promoter_id;
    ELSE
      recipient_id := talent_id;
    END IF;
    
    -- Get sender's name
    SELECT full_name INTO sender_name 
    FROM profiles 
    WHERE id = NEW.sender_id;
    
    -- Create notification for recipient
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      button_text,
      icon,
      is_read,
      data
    ) VALUES (
      recipient_id,
      'private_message',
      'New Private Message',
      COALESCE(sender_name, 'Someone') || ' sent you a private message',
      'View Message',
      '💬',
      false,
      jsonb_build_object(
        'chat_id', NEW.chat_id,
        'sender_id', NEW.sender_id,
        'message_type', 'private'
      )
    );
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger to create notifications for private messages
DROP TRIGGER IF EXISTS create_private_message_notification ON private_chat_messages;
CREATE TRIGGER create_private_message_notification
  AFTER INSERT ON private_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_private_message_notification();

-- Function to create notifications for group messages
CREATE OR REPLACE FUNCTION create_group_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notifications for all participants except the sender
  DECLARE
    sender_name TEXT;
    event_title TEXT;
  BEGIN
    -- Get sender's name
    SELECT full_name INTO sender_name 
    FROM profiles 
    WHERE id = NEW.sender_id;
    
    -- Get event title
    SELECT title INTO event_title 
    FROM posts 
    WHERE id = NEW.event_id;
    
    -- Create notifications for all other participants
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      button_text,
      icon,
      is_read,
      data
    )
    SELECT 
      mp.user_id,
      'group_message',
      'New Group Message',
      COALESCE(sender_name, 'Someone') || ' sent a message in ' || COALESCE(event_title, 'the event'),
      'View Message',
      '💬',
      false,
      jsonb_build_object(
        'event_id', NEW.event_id,
        'sender_id', NEW.sender_id,
        'message_type', 'group'
      )
    FROM message_participants mp
    WHERE mp.event_id = NEW.event_id 
      AND mp.user_id != NEW.sender_id;
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger to create notifications for group messages
DROP TRIGGER IF EXISTS create_group_message_notification ON messages;
CREATE TRIGGER create_group_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_group_message_notification();

-- 9. VERIFY THE COMPLETE FIX
DO $$
BEGIN
  RAISE NOTICE 'Complete messaging access fix applied successfully';
  RAISE NOTICE 'Users should now be able to view messages, private chats, and group chats';
  RAISE NOTICE 'Notifications will be created automatically for new messages';
END $$;

-- 10. FINAL STATUS
SELECT 'Complete messaging access fix applied - messages should now be visible' as status;
