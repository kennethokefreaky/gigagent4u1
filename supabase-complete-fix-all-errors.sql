-- COMPLETE FIX FOR ALL OFFER ACCEPTANCE AND GROUP CHAT ERRORS
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: Fix Candidates Table RLS Policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Promoters can view their own candidates" ON candidates;
DROP POLICY IF EXISTS "Talents can view their own candidates" ON candidates;
DROP POLICY IF EXISTS "Users can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Promoters can update their own candidates" ON candidates;
DROP POLICY IF EXISTS "Talents can update their own candidates" ON candidates;

-- Create new policies
CREATE POLICY "Promoters can view their own candidates" ON candidates 
FOR SELECT USING (promoter_id = auth.uid());

CREATE POLICY "Talents can view their own candidates" ON candidates 
FOR SELECT USING (talent_id = auth.uid());

-- Both promoters and talents can insert candidates
CREATE POLICY "Users can insert candidates" ON candidates 
FOR INSERT WITH CHECK (
  promoter_id = auth.uid() OR 
  talent_id = auth.uid()
);

CREATE POLICY "Promoters can update their own candidates" ON candidates 
FOR UPDATE USING (promoter_id = auth.uid());

CREATE POLICY "Talents can update their own candidates" ON candidates 
FOR UPDATE USING (talent_id = auth.uid());

-- ========================================
-- STEP 2: Fix Messages Table RLS Policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages for their events" ON messages;
DROP POLICY IF EXISTS "Users can send messages for their events" ON messages;
DROP POLICY IF EXISTS "Users can send messages for their events securely" ON messages;
DROP POLICY IF EXISTS "Users can view their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON message_participants;
DROP POLICY IF EXISTS "Users can join conversations securely" ON message_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can view their read status" ON message_read_status;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_read_status;
DROP POLICY IF EXISTS "Users can mark messages as read securely" ON message_read_status;
DROP POLICY IF EXISTS "Users can update their read status" ON message_read_status;

-- Create simplified, working policies for messages
CREATE POLICY "Users can view messages for their events" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages for their events" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Create simplified policies for message_participants
CREATE POLICY "Users can view their own participation" ON message_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Create simplified policies for message_read_status
CREATE POLICY "Users can view their read status" ON message_read_status
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can mark messages as read" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their read status" ON message_read_status
  FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- STEP 3: Fix Notifications Table RLS Policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_can_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_users_can_create_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_delete_own_notifications" ON notifications;

-- Create working policies for notifications
CREATE POLICY "users_can_view_own_notifications" ON notifications 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "authenticated_users_can_create_notifications" ON notifications 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_can_update_own_notifications" ON notifications 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_notifications" ON notifications 
FOR DELETE USING (user_id = auth.uid());

-- ========================================
-- STEP 4: Verify All Policies
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
WHERE tablename IN ('candidates', 'messages', 'message_participants', 'message_read_status', 'notifications')
ORDER BY tablename, policyname;
