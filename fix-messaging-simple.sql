-- SIMPLE MESSAGING FIX
-- Just allows talent to send private messages to promoter

-- 1. DROP ALL EXISTING POLICIES
DROP POLICY IF EXISTS "private_messages_participants" ON private_chat_messages;
DROP POLICY IF EXISTS "private_messages_send_participants" ON private_chat_messages;
DROP POLICY IF EXISTS "private_participants_participants" ON private_chat_participants;
DROP POLICY IF EXISTS "private_participants_join" ON private_chat_participants;
DROP POLICY IF EXISTS "private_participants_update" ON private_chat_participants;
DROP POLICY IF EXISTS "group_messages_participants" ON messages;
DROP POLICY IF EXISTS "group_messages_send_participants" ON messages;
DROP POLICY IF EXISTS "group_participants_participants" ON message_participants;
DROP POLICY IF EXISTS "group_participants_join" ON message_participants;
DROP POLICY IF EXISTS "group_participants_update" ON message_participants;
DROP POLICY IF EXISTS "read_status_participants" ON message_read_status;
DROP POLICY IF EXISTS "read_status_mark" ON message_read_status;
DROP POLICY IF EXISTS "read_status_update" ON message_read_status;

-- 2. CREATE SIMPLE POLICIES - NO RECURSION
-- Users can see private messages they sent
CREATE POLICY "private_messages_own" ON private_chat_messages
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

-- Users can see group messages they sent
CREATE POLICY "group_messages_own" ON messages
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

-- Users can see their own read status
CREATE POLICY "read_status_own" ON message_read_status
  FOR SELECT USING (user_id = auth.uid());

-- Users can mark messages as read
CREATE POLICY "read_status_mark" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. ENSURE PARTICIPANTS ARE CREATED AUTOMATICALLY
-- Function to ensure both participants are in private chats
CREATE OR REPLACE FUNCTION ensure_private_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract talent and promoter IDs from chat_id
  DECLARE
    talent_id UUID;
    promoter_id UUID;
  BEGIN
    talent_id := split_part(NEW.chat_id, '-', 1);
    promoter_id := split_part(NEW.chat_id, '-', 2);
    
    -- Add both participants
    INSERT INTO private_chat_participants (chat_id, user_id)
    VALUES (NEW.chat_id, talent_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
    
    INSERT INTO private_chat_participants (chat_id, user_id)
    VALUES (NEW.chat_id, promoter_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS ensure_private_chat_participants ON private_chat_messages;
CREATE TRIGGER ensure_private_chat_participants
  BEFORE INSERT ON private_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_private_chat_participants();

-- 4. CREATE NOTIFICATIONS
-- Function to create notifications for private messages
CREATE OR REPLACE FUNCTION create_private_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    talent_id UUID;
    promoter_id UUID;
    recipient_id UUID;
    sender_name TEXT;
  BEGIN
    talent_id := split_part(NEW.chat_id, '-', 1);
    promoter_id := split_part(NEW.chat_id, '-', 2);
    
    IF NEW.sender_id = talent_id THEN
      recipient_id := promoter_id;
    ELSE
      recipient_id := talent_id;
    END IF;
    
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
    
    INSERT INTO notifications (user_id, type, title, message, button_text, icon, is_read)
    VALUES (recipient_id, 'private_message', 'New Private Message', 
            COALESCE(sender_name, 'Someone') || ' sent you a private message', 
            'View Message', '💬', false);
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS create_private_message_notification ON private_chat_messages;
CREATE TRIGGER create_private_message_notification
  AFTER INSERT ON private_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_private_message_notification();

-- 5. FINAL STATUS
SELECT 'Simple messaging fix applied - talent can send private messages to promoter' as status;
