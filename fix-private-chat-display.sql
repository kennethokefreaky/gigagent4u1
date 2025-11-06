-- FIX PRIVATE CHAT DISPLAY ISSUE
-- The problem: getUserPrivateChats can't see other participants to determine "other user"
-- This fixes the RLS policies to allow proper private chat display

-- 1. DROP EXISTING PRIVATE CHAT POLICIES
DROP POLICY IF EXISTS "private_participants_view" ON private_chat_participants;
DROP POLICY IF EXISTS "private_participants_join" ON private_chat_participants;
DROP POLICY IF EXISTS "private_messages_view" ON private_chat_messages;
DROP POLICY IF EXISTS "private_messages_send" ON private_chat_messages;

-- 2. CREATE FIXED PRIVATE CHAT POLICIES
-- Users can see participants in chats they are part of (including other participants)
CREATE POLICY "private_participants_view_fixed" ON private_chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    chat_id IN (
      SELECT pcp2.chat_id 
      FROM private_chat_participants pcp2 
      WHERE pcp2.user_id = auth.uid()
    )
  );

-- Users can join private chats
CREATE POLICY "private_participants_join_fixed" ON private_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can see private messages in chats they participate in
CREATE POLICY "private_messages_view_fixed" ON private_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chat_participants pcp
      WHERE pcp.chat_id = private_chat_messages.chat_id
      AND pcp.user_id = auth.uid()
    )
  );

-- Users can send private messages
CREATE POLICY "private_messages_send_fixed" ON private_chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- 3. ENSURE PARTICIPANTS ARE CREATED AUTOMATICALLY
-- Function to ensure both participants are in private chats
CREATE OR REPLACE FUNCTION ensure_private_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create trigger for private chats
DROP TRIGGER IF EXISTS ensure_private_chat_participants ON private_chat_messages;
CREATE TRIGGER ensure_private_chat_participants
  BEFORE INSERT ON private_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_private_chat_participants();

-- 4. CREATE NOTIFICATIONS FOR PRIVATE MESSAGES
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

-- Create trigger for private message notifications
DROP TRIGGER IF EXISTS create_private_message_notification ON private_chat_messages;
CREATE TRIGGER create_private_message_notification
  AFTER INSERT ON private_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_private_message_notification();

-- 5. FINAL STATUS
SELECT 'Private chat display fix applied - promoters can now see private messages in messages page' as status;
