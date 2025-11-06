-- NUCLEAR OPTION - COMPLETE MESSAGING FIX
-- This disables complex RLS and uses simple, working policies
-- NO MORE INFINITE RECURSION - NO MORE ERRORS

-- 1. DISABLE RLS TEMPORARILY TO CLEAR ALL POLICIES
ALTER TABLE private_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES (they're all broken)
DROP POLICY IF EXISTS "private_messages_view" ON private_chat_messages;
DROP POLICY IF EXISTS "private_messages_send" ON private_chat_messages;
DROP POLICY IF EXISTS "private_participants_view" ON private_chat_participants;
DROP POLICY IF EXISTS "private_participants_join" ON private_chat_participants;
DROP POLICY IF EXISTS "group_messages_view" ON messages;
DROP POLICY IF EXISTS "group_messages_send" ON messages;
DROP POLICY IF EXISTS "group_participants_view" ON message_participants;
DROP POLICY IF EXISTS "group_participants_join" ON message_participants;
DROP POLICY IF EXISTS "group_participants_update" ON message_participants;
DROP POLICY IF EXISTS "read_status_view" ON message_read_status;
DROP POLICY IF EXISTS "read_status_mark" ON message_read_status;
DROP POLICY IF EXISTS "notifications_view" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

-- 3. RE-ENABLE RLS
ALTER TABLE private_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SIMPLE, WORKING POLICIES (NO RECURSION)
-- Private messages: Anyone can see messages in chats they participate in
CREATE POLICY "private_messages_simple" ON private_chat_messages
  FOR ALL USING (
    chat_id IN (
      SELECT chat_id FROM private_chat_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Private participants: Users can see and manage their own participation
CREATE POLICY "private_participants_simple" ON private_chat_participants
  FOR ALL USING (user_id = auth.uid());

-- Group messages: Anyone can see messages in events they participate in
CREATE POLICY "group_messages_simple" ON messages
  FOR ALL USING (
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Group participants: Users can see and manage their own participation
CREATE POLICY "group_participants_simple" ON message_participants
  FOR ALL USING (user_id = auth.uid());

-- Notifications: Users can see their own notifications
CREATE POLICY "notifications_simple" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- 5. ENSURE PARTICIPANTS ARE CREATED AUTOMATICALLY
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

-- Function to ensure sender is a participant in group chats
CREATE OR REPLACE FUNCTION ensure_group_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO message_participants (event_id, user_id)
  VALUES (NEW.event_id, NEW.sender_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for group chats
DROP TRIGGER IF EXISTS ensure_group_chat_participants ON messages;
CREATE TRIGGER ensure_group_chat_participants
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_group_chat_participants();

-- 6. CREATE NOTIFICATIONS FOR PRIVATE MESSAGES
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

-- 7. CREATE NOTIFICATIONS FOR GROUP MESSAGES
CREATE OR REPLACE FUNCTION create_group_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    sender_name TEXT;
    event_title TEXT;
  BEGIN
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
    SELECT title INTO event_title FROM posts WHERE id = NEW.event_id;
    
    INSERT INTO notifications (user_id, type, title, message, button_text, icon, is_read)
    SELECT 
      mp.user_id, 
      'group_message', 
      'New Group Message', 
      COALESCE(sender_name, 'Someone') || ' sent a message in ' || COALESCE(event_title, 'the event'), 
      'View Message', 
      '💬', 
      false
    FROM message_participants mp 
    WHERE mp.event_id = NEW.event_id 
    AND mp.user_id != NEW.sender_id;
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger for group message notifications
DROP TRIGGER IF EXISTS create_group_message_notification ON messages;
CREATE TRIGGER create_group_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_group_message_notification();

-- 8. FINAL STATUS
SELECT 'NUCLEAR OPTION applied - all complex RLS policies removed, simple policies created' as status;
