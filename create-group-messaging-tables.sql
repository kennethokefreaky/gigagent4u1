-- CREATE DEDICATED GROUP MESSAGING TABLES
-- This creates separate tables for group messages to avoid conflicts
-- Run this in your Supabase SQL editor

-- 1. CREATE GROUP MESSAGES TABLE
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE GROUP PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS group_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_group_messages_event ON group_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_group_participants_event ON group_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user ON group_participants(user_id);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES FOR GROUP MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their group chats" ON group_messages;
CREATE POLICY "Users can view messages in their group chats" ON group_messages
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM group_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their group chats" ON group_messages;
CREATE POLICY "Users can insert messages in their group chats" ON group_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    event_id IN (
      SELECT event_id FROM group_participants 
      WHERE user_id = auth.uid()
    )
  );

-- 6. CREATE RLS POLICIES FOR GROUP PARTICIPANTS
DROP POLICY IF EXISTS "Users can view participants in their group chats" ON group_participants;
CREATE POLICY "Users can view participants in their group chats" ON group_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    event_id IN (
      SELECT event_id FROM group_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert participants in their group chats" ON group_participants;
CREATE POLICY "Users can insert participants in their group chats" ON group_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own participant records" ON group_participants;
CREATE POLICY "Users can update their own participant records" ON group_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 7. GRANT PERMISSIONS
GRANT ALL ON group_messages TO authenticated;
GRANT ALL ON group_participants TO authenticated;

-- 8. VERIFY TABLES CREATED
SELECT 'Group messaging tables created successfully' as status;
