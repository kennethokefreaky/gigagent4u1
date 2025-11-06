-- SIMPLIFY MESSAGING TABLES - UNIFIED APPROACH
-- This creates ONE simple table for ALL messaging
-- No more complex relationships, no more RLS issues

-- 1. CREATE UNIFIED MESSAGING TABLE
CREATE TABLE IF NOT EXISTS unified_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL, -- Format: "private_talentId-promoterId" or "group_eventId"
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('private', 'group')),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE UNIFIED PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS unified_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('private', 'group')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 3. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_unified_messages_conversation_id ON unified_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_unified_messages_created_at ON unified_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_participants_conversation_id ON unified_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_unified_participants_user_id ON unified_participants(user_id);

-- 4. ENABLE RLS
ALTER TABLE unified_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_participants ENABLE ROW LEVEL SECURITY;

-- 5. CREATE SIMPLE RLS POLICIES
-- Users can see messages in conversations they participate in
CREATE POLICY "unified_messages_view" ON unified_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT conversation_id FROM unified_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can see and manage their own participation
CREATE POLICY "unified_participants_view" ON unified_participants
  FOR ALL USING (user_id = auth.uid());

-- 6. CREATE SIMPLE TRIGGERS
-- Function to ensure participants are added automatically
CREATE OR REPLACE FUNCTION ensure_unified_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- For private chats: add both talent and promoter
  IF NEW.conversation_type = 'private' THEN
    DECLARE
      talent_id UUID;
      promoter_id UUID;
    BEGIN
      talent_id := split_part(NEW.conversation_id, '-', 2); -- After "private_"
      promoter_id := split_part(NEW.conversation_id, '-', 3);
      
      INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
      VALUES (NEW.conversation_id, 'private', talent_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
      
      INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
      VALUES (NEW.conversation_id, 'private', promoter_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END;
  END IF;
  
  -- For group chats: add sender if not already participant
  IF NEW.conversation_type = 'group' THEN
    INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
    VALUES (NEW.conversation_id, 'group', NEW.sender_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS ensure_unified_participants ON unified_messages;
CREATE TRIGGER ensure_unified_participants
  BEFORE INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_unified_participants();

-- 7. CREATE NOTIFICATION TRIGGER
CREATE OR REPLACE FUNCTION create_unified_notification()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    recipient_id UUID;
    sender_name TEXT;
    notification_title TEXT;
    notification_message TEXT;
  BEGIN
    -- Get sender name
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
    
    -- Create notifications for all participants except sender
    INSERT INTO notifications (user_id, type, title, message, button_text, icon, is_read)
    SELECT 
      up.user_id,
      CASE 
        WHEN NEW.conversation_type = 'private' THEN 'private_message'
        ELSE 'group_message'
      END,
      CASE 
        WHEN NEW.conversation_type = 'private' THEN 'New Private Message'
        ELSE 'New Group Message'
      END,
      COALESCE(sender_name, 'Someone') || 
      CASE 
        WHEN NEW.conversation_type = 'private' THEN ' sent you a private message'
        ELSE ' sent a message in the group chat'
      END,
      'View Message',
      '💬',
      false
    FROM unified_participants up
    WHERE up.conversation_id = NEW.conversation_id 
    AND up.user_id != NEW.sender_id;
    
    RETURN NEW;
  END;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS create_unified_notification ON unified_messages;
CREATE TRIGGER create_unified_notification
  AFTER INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_unified_notification();

-- 8. FINAL STATUS
SELECT 'Unified messaging tables created - much simpler structure' as status;
