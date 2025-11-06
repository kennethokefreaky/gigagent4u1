-- RESTORE MESSAGING TABLES
-- This recreates the tables that were accidentally dropped
-- Run this in your Supabase SQL editor

-- 1. RECREATE OLD GROUP MESSAGING TABLES (needed for existing code)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- 2. RECREATE OLD PRIVATE MESSAGING TABLES (needed for existing code)
CREATE TABLE IF NOT EXISTS private_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- 3. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_participants_event_id ON message_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON message_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_messages_chat_id ON private_chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_messages_sender_id ON private_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_participants_chat_id ON private_chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_participants_user_id ON private_chat_participants(user_id);

-- 4. ENABLE RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_participants ENABLE ROW LEVEL SECURITY;

-- 5. CREATE BASIC RLS POLICIES
-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Message participants policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON message_participants;
CREATE POLICY "Users can view participants in their conversations" ON message_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert participants in their conversations" ON message_participants;
CREATE POLICY "Users can insert participants in their conversations" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Private chat policies
DROP POLICY IF EXISTS "Users can view their private chat messages" ON private_chat_messages;
CREATE POLICY "Users can view their private chat messages" ON private_chat_messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM private_chat_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert private chat messages" ON private_chat_messages;
CREATE POLICY "Users can insert private chat messages" ON private_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
      SELECT chat_id FROM private_chat_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Private chat participants policies
DROP POLICY IF EXISTS "Users can view their private chat participants" ON private_chat_participants;
CREATE POLICY "Users can view their private chat participants" ON private_chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    chat_id IN (
      SELECT chat_id FROM private_chat_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their private chat participants" ON private_chat_participants;
CREATE POLICY "Users can insert their private chat participants" ON private_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. GRANT PERMISSIONS
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_participants TO authenticated;
GRANT ALL ON message_read_status TO authenticated;
GRANT ALL ON private_chat_messages TO authenticated;
GRANT ALL ON private_chat_participants TO authenticated;

-- 7. VERIFY RESTORATION
SELECT 'Messaging tables restored successfully' as status;
