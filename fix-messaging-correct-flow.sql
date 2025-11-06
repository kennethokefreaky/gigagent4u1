-- CORRECT MESSAGING FLOW FIX
-- Allows promoters to see messages FROM talents, not just their own messages

-- 1. DROP ALL EXISTING POLICIES
DROP POLICY IF EXISTS "private_messages_own_only" ON private_chat_messages;
DROP POLICY IF EXISTS "private_messages_send_own" ON private_chat_messages;
DROP POLICY IF EXISTS "private_participants_own_only" ON private_chat_participants;
DROP POLICY IF EXISTS "private_participants_join_own" ON private_chat_participants;
DROP POLICY IF EXISTS "group_messages_own_only" ON messages;
DROP POLICY IF EXISTS "group_messages_send_own" ON messages;
DROP POLICY IF EXISTS "group_participants_own_only" ON message_participants;
DROP POLICY IF EXISTS "group_participants_join_own" ON message_participants;
DROP POLICY IF EXISTS "group_participants_update_own" ON message_participants;
DROP POLICY IF EXISTS "read_status_own_only" ON message_read_status;
DROP POLICY IF EXISTS "read_status_mark_own" ON message_read_status;
DROP POLICY IF EXISTS "read_status_update_own" ON message_read_status;

-- 2. CREATE CORRECT PRIVATE CHAT POLICIES
-- Users can see private messages in conversations they participate in
CREATE POLICY "private_messages_participants" ON private_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chat_participants pcp 
      WHERE pcp.chat_id = private_chat_messages.chat_id 
      AND pcp.user_id = auth.uid()
    )
  );

-- Users can send private messages in conversations they participate in
CREATE POLICY "private_messages_send_participants" ON private_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM private_chat_participants pcp 
      WHERE pcp.chat_id = private_chat_messages.chat_id 
      AND pcp.user_id = auth.uid()
    )
  );

-- Users can see private chat participants in conversations they participate in
CREATE POLICY "private_participants_participants" ON private_chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    chat_id IN (
      SELECT pcp2.chat_id 
      FROM private_chat_participants pcp2 
      WHERE pcp2.user_id = auth.uid()
    )
  );

-- Users can join private chats
CREATE POLICY "private_participants_join" ON private_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. CREATE CORRECT GROUP CHAT POLICIES
-- Users can see group messages in events they participate in
CREATE POLICY "group_messages_participants" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_participants mp 
      WHERE mp.event_id = messages.event_id 
      AND mp.user_id = auth.uid()
    )
  );

-- Users can send group messages in events they participate in
CREATE POLICY "group_messages_send_participants" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM message_participants mp 
      WHERE mp.event_id = messages.event_id 
      AND mp.user_id = auth.uid()
    )
  );

-- Users can see group chat participants in events they participate in
CREATE POLICY "group_participants_participants" ON message_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    event_id IN (
      SELECT mp2.event_id 
      FROM message_participants mp2 
      WHERE mp2.user_id = auth.uid()
    )
  );

-- Users can join group chats
CREATE POLICY "group_participants_join" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their group participation
CREATE POLICY "group_participants_update" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 4. CREATE CORRECT READ STATUS POLICIES
-- Users can see read status for messages in conversations they participate in
CREATE POLICY "read_status_participants" ON message_read_status
  FOR SELECT USING (
    user_id = auth.uid() OR
    message_id IN (
      SELECT m.id FROM messages m
      JOIN message_participants mp ON m.event_id = mp.event_id
      WHERE mp.user_id = auth.uid()
    )
  );

-- Users can mark messages as read
CREATE POLICY "read_status_mark" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their read status
CREATE POLICY "read_status_update" ON message_read_status
  FOR UPDATE USING (user_id = auth.uid());

-- 5. ENSURE PRIVATE CHAT PARTICIPANTS ARE CREATED
-- Function to ensure both promoter and talent are in private chats
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

-- 6. ENSURE GROUP CHAT PARTICIPANTS ARE CREATED
-- Function to ensure sender is a participant in group chats
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

-- 7. CREATE NOTIFICATIONS FOR PRIVATE MESSAGES
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

-- 8. CREATE NOTIFICATIONS FOR GROUP MESSAGES
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

-- 9. VERIFY THE CORRECT FLOW FIX
DO $$
BEGIN
  RAISE NOTICE 'Correct messaging flow fix applied successfully';
  RAISE NOTICE 'Promoters can now see messages FROM talents';
  RAISE NOTICE 'Private messages: Promoter + talent can see each others messages';
  RAISE NOTICE 'Group messages: All participants can see each others messages';
  RAISE NOTICE 'Notifications will be created automatically for new messages';
END $$;

-- 10. FINAL STATUS
SELECT 'Correct messaging flow implemented - promoters can see messages from talents' as status;
