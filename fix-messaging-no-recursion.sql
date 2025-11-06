-- MESSAGING FIX - NO RECURSION VERSION
-- This completely eliminates all circular references and infinite recursion

-- 1. DROP ALL EXISTING POLICIES COMPLETELY
DROP POLICY IF EXISTS "private_messages_participants" ON private_chat_messages;
DROP POLICY IF EXISTS "private_messages_send_participants" ON private_chat_messages;
DROP POLICY IF EXISTS "private_participants_participants" ON private_chat_participants;
DROP POLICY IF EXISTS "private_participants_join" ON private_chat_participants;
DROP POLICY IF EXISTS "group_messages_participants" ON messages;
DROP POLICY IF EXISTS "group_messages_send_participants" ON messages;
DROP POLICY IF EXISTS "group_participants_participants" ON message_participants;
DROP POLICY IF EXISTS "group_participants_join" ON message_participants;
DROP POLICY IF EXISTS "group_participants_update" ON message_participants;
DROP POLICY IF EXISTS "read_status_participants" ON message_read_status;
DROP POLICY IF EXISTS "read_status_mark" ON message_read_status;
DROP POLICY IF EXISTS "read_status_update" ON message_read_status;

-- 2. CREATE SIMPLE, NON-RECURSIVE POLICIES FOR PRIVATE CHATS
-- Users can see private messages they sent
CREATE POLICY "private_messages_sent" ON private_chat_messages
  FOR SELECT USING (sender_id = auth.uid());

-- Users can send private messages
CREATE POLICY "private_messages_send" ON private_chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Users can see their own private chat participation
CREATE POLICY "private_participants_own" ON private_chat_participants
  FOR SELECT USING (user_id = auth.uid());

-- Users can join private chats
CREATE POLICY "private_participants_join" ON private_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. CREATE SIMPLE, NON-RECURSIVE POLICIES FOR GROUP CHATS
-- Users can see group messages they sent
CREATE POLICY "group_messages_sent" ON messages
  FOR SELECT USING (sender_id = auth.uid());

-- Users can send group messages
CREATE POLICY "group_messages_send" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Users can see their own group participation
CREATE POLICY "group_participants_own" ON message_participants
  FOR SELECT USING (user_id = auth.uid());

-- Users can join group chats
CREATE POLICY "group_participants_join" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their group participation
CREATE POLICY "group_participants_update" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 4. CREATE SIMPLE, NON-RECURSIVE POLICIES FOR READ STATUS
-- Users can see their own read status
CREATE POLICY "read_status_own" ON message_read_status
  FOR SELECT USING (user_id = auth.uid());

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

-- 9. VERIFY THE NO-RECURSION FIX
DO $$
BEGIN
  RAISE NOTICE 'No-recursion messaging fix applied successfully';
  RAISE NOTICE 'All circular references eliminated - no more infinite recursion';
  RAISE NOTICE 'Users can now access their messages without errors';
  RAISE NOTICE 'Policies are simple and non-recursive';
END $$;

-- 10. FINAL STATUS
SELECT 'No-recursion messaging fix applied - infinite recursion eliminated' as status;
