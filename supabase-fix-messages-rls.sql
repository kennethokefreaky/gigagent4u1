-- Fix RLS policies for messages tables to resolve circular dependency issues
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view messages for events they participate in" ON messages;
DROP POLICY IF EXISTS "Users can send messages for events they participate in" ON messages;
DROP POLICY IF EXISTS "Users can view participants for their events" ON message_participants;
DROP POLICY IF EXISTS "Users can join event conversations" ON message_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can view read status for their messages" ON message_read_status;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_read_status;
DROP POLICY IF EXISTS "Users can update their own read status" ON message_read_status;

-- Step 2: Create simplified, working RLS policies

-- Messages table policies
-- Users can view messages for events they're participants in (simplified)
CREATE POLICY "Users can view messages for their events" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can send messages for events they're participants in
CREATE POLICY "Users can send messages for their events" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Message participants table policies
-- Users can view their own participation records
CREATE POLICY "Users can view their own participation" ON message_participants
  FOR SELECT USING (user_id = auth.uid());

-- Users can join conversations (insert their own participation)
CREATE POLICY "Users can join conversations" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own participation status
CREATE POLICY "Users can update their own participation" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Message read status table policies
-- Users can view read status for messages they have access to
CREATE POLICY "Users can view their read status" ON message_read_status
  FOR SELECT USING (user_id = auth.uid());

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own read status
CREATE POLICY "Users can update their read status" ON message_read_status
  FOR UPDATE USING (user_id = auth.uid());

-- Step 3: Verify the policies were created
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
