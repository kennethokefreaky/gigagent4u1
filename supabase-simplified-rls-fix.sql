-- SIMPLIFIED RLS FIX FOR MESSAGES AND PARTICIPANTS
-- This removes complex policies and uses simple, working ones

-- ========================================
-- STEP 1: Temporarily Disable RLS for Testing
-- ========================================

-- Disable RLS temporarily to test if that's the issue
ALTER TABLE message_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: Re-enable RLS with Simple Policies
-- ========================================

-- Re-enable RLS
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: Create Simple, Working Policies
-- ========================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON message_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can view messages for their events" ON messages;
DROP POLICY IF EXISTS "Users can send messages for their events" ON messages;
DROP POLICY IF EXISTS "Users can view their read status" ON message_read_status;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_read_status;
DROP POLICY IF EXISTS "Users can update their read status" ON message_read_status;

-- Create SIMPLE policies that just check user_id
CREATE POLICY "simple_message_participants_select" ON message_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "simple_message_participants_insert" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_message_participants_update" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "simple_messages_select" ON messages
  FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "simple_messages_insert" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "simple_message_read_status_select" ON message_read_status
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "simple_message_read_status_insert" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_message_read_status_update" ON message_read_status
  FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- STEP 4: Verify Policies
-- ========================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename IN ('messages', 'message_participants', 'message_read_status')
ORDER BY tablename, policyname;
