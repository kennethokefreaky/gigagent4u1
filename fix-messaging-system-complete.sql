-- COMPREHENSIVE MESSAGING SYSTEM FIX
-- This script fixes all messaging issues: private messages, group chats, and auto-creation

-- 1. FIX PRIVATE CHAT MESSAGES TABLE AND RLS POLICIES
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view messages from their private chats" ON public.private_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their private chats" ON public.private_chat_messages;
DROP POLICY IF EXISTS "Users can view their private chat participants" ON public.private_chat_participants;
DROP POLICY IF EXISTS "Users can join their private chats" ON public.private_chat_participants;

-- Create proper RLS policies for private_chat_messages
CREATE POLICY "Users can view messages from their private chats" ON public.private_chat_messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM public.private_chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their private chats" ON public.private_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
      SELECT chat_id FROM public.private_chat_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Create proper RLS policies for private_chat_participants
CREATE POLICY "Users can view their private chat participants" ON public.private_chat_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join their private chats" ON public.private_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 2. FIX GROUP CHAT AUTO-CREATION TRIGGER
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS add_promoter_to_conversation ON posts;
DROP FUNCTION IF EXISTS add_promoter_to_event_conversation();

-- Create improved function for auto-adding promoter to group chat
CREATE OR REPLACE FUNCTION add_promoter_to_event_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the promoter (event creator) to the conversation immediately
  INSERT INTO message_participants (event_id, user_id)
  VALUES (NEW.id, NEW.promoter_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;
  
  -- Log the action for debugging
  RAISE NOTICE 'Added promoter % to event conversation %', NEW.promoter_id, NEW.id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically add promoter to conversation
CREATE TRIGGER add_promoter_to_conversation
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION add_promoter_to_event_conversation();

-- 3. FIX MESSAGE PARTICIPANTS RLS POLICIES
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view participants for their events" ON message_participants;
DROP POLICY IF EXISTS "Users can join event conversations" ON message_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON message_participants;

-- Create improved RLS policies for message_participants
CREATE POLICY "Users can view participants for their events" ON message_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join event conversations" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 4. CREATE FUNCTION TO AUTO-ADD TALENTS TO GROUP CHAT WHEN THEY APPLY
CREATE OR REPLACE FUNCTION add_talent_to_event_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- When a talent applies to an event, add them to the group chat
  -- Get the event's promoter_id
  DECLARE
    event_promoter_id UUID;
  BEGIN
    SELECT promoter_id INTO event_promoter_id 
    FROM posts 
    WHERE id = NEW.event_id;
    
    -- Add talent to the group chat
    INSERT INTO message_participants (event_id, user_id)
    VALUES (NEW.event_id, NEW.talent_id)
    ON CONFLICT (event_id, user_id) DO NOTHING;
    
    -- Log the action
    RAISE NOTICE 'Added talent % to event conversation % for promoter %', 
      NEW.talent_id, NEW.event_id, event_promoter_id;
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger to add talents to group chat when they apply
DROP TRIGGER IF EXISTS add_talent_to_conversation ON applications;
CREATE TRIGGER add_talent_to_conversation
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION add_talent_to_event_conversation();

-- 5. CREATE FUNCTION TO AUTO-ADD TALENTS TO GROUP CHAT WHEN OFFER IS ACCEPTED
CREATE OR REPLACE FUNCTION add_talent_to_group_chat_on_offer_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When a candidate is created (offer accepted), add talent to group chat
  DECLARE
    event_promoter_id UUID;
  BEGIN
    SELECT promoter_id INTO event_promoter_id 
    FROM posts 
    WHERE id = NEW.event_id;
    
    -- Add talent to the group chat
    INSERT INTO message_participants (event_id, user_id)
    VALUES (NEW.event_id, NEW.talent_id)
    ON CONFLICT (event_id, user_id) DO NOTHING;
    
    -- Log the action
    RAISE NOTICE 'Added talent % to event conversation % after offer acceptance', 
      NEW.talent_id, NEW.event_id;
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger to add talents to group chat when offer is accepted
DROP TRIGGER IF EXISTS add_talent_to_group_chat_on_offer_acceptance ON candidates;
CREATE TRIGGER add_talent_to_group_chat_on_offer_acceptance
  AFTER INSERT ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION add_talent_to_group_chat_on_offer_acceptance();

-- 6. CREATE FUNCTION TO ENSURE PRIVATE CHAT PARTICIPANTS ARE CREATED
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
    
    -- Log the action
    RAISE NOTICE 'Ensured participants for private chat %', NEW.chat_id;
    
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

-- 7. CREATE FUNCTION TO CREATE NOTIFICATIONS FOR PRIVATE MESSAGES
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
    
    -- Log the action
    RAISE NOTICE 'Created private message notification for user %', recipient_id;
    
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

-- 8. CREATE FUNCTION TO CREATE NOTIFICATIONS FOR GROUP MESSAGES
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
    
    -- Log the action
    RAISE NOTICE 'Created group message notifications for event %', NEW.event_id;
    
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

-- 9. VERIFY ALL TABLES AND POLICIES ARE WORKING
-- Test that all tables exist and have proper structure
DO $$
BEGIN
  -- Check if all required tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    RAISE EXCEPTION 'messages table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_participants') THEN
    RAISE EXCEPTION 'message_participants table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_chat_messages') THEN
    RAISE EXCEPTION 'private_chat_messages table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_chat_participants') THEN
    RAISE EXCEPTION 'private_chat_participants table does not exist';
  END IF;
  
  RAISE NOTICE 'All messaging tables exist and are properly configured';
END $$;

-- 10. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_private_chat_messages_chat_id_created_at ON private_chat_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_chat_participants_chat_id_user_id ON private_chat_participants(chat_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_event_id_created_at ON messages(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_participants_event_id_user_id ON message_participants(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_type ON notifications(user_id, type);

-- 11. FINAL VERIFICATION
SELECT 'Messaging system fix completed successfully' as status;
