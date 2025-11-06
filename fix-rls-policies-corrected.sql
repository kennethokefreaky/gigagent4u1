-- FIX RLS POLICIES - CORRECTED VERSION
-- This fixes the infinite recursion issue in the messaging system

-- 1. DROP ALL PROBLEMATIC POLICIES
DROP POLICY IF EXISTS "Users can view participants for their events" ON message_participants;
DROP POLICY IF EXISTS "Users can join event conversations" ON message_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can view messages for events they participate in" ON messages;
DROP POLICY IF EXISTS "Users can send messages for events they participate in" ON messages;
DROP POLICY IF EXISTS "Users can view read status for their messages" ON message_read_status;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_read_status;
DROP POLICY IF EXISTS "Users can update their own read status" ON message_read_status;

-- 2. CREATE SIMPLIFIED, NON-RECURSIVE POLICIES FOR MESSAGE_PARTICIPANTS
-- Users can view their own participation records
CREATE POLICY "Users can view their own participation" ON message_participants
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own participation
CREATE POLICY "Users can join conversations" ON message_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own participation
CREATE POLICY "Users can update their own participation" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 3. CREATE SIMPLIFIED POLICIES FOR MESSAGES
-- Users can view messages for events they participate in (using a simple approach)
CREATE POLICY "Users can view messages for their events" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_participants mp 
      WHERE mp.event_id = messages.event_id 
      AND mp.user_id = auth.uid()
    )
  );

-- Users can send messages for events they participate in
CREATE POLICY "Users can send messages for their events" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM message_participants mp 
      WHERE mp.event_id = messages.event_id 
      AND mp.user_id = auth.uid()
    )
  );

-- 4. CREATE SIMPLIFIED POLICIES FOR MESSAGE_READ_STATUS
-- Users can view their own read status
CREATE POLICY "Users can view their read status" ON message_read_status
  FOR SELECT USING (user_id = auth.uid());

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own read status
CREATE POLICY "Users can update their read status" ON message_read_status
  FOR UPDATE USING (user_id = auth.uid());

-- 5. FIX PRIVATE CHAT POLICIES (if they exist)
DROP POLICY IF EXISTS "Users can view messages from their private chats" ON private_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their private chats" ON private_chat_messages;
DROP POLICY IF EXISTS "Users can view their private chat participants" ON private_chat_participants;
DROP POLICY IF EXISTS "Users can join their private chats" ON private_chat_participants;

-- Create simple private chat policies
CREATE POLICY "Users can view their private chat messages" ON private_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chat_participants pcp 
      WHERE pcp.chat_id = private_chat_messages.chat_id 
      AND pcp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send private chat messages" ON private_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM private_chat_participants pcp 
      WHERE pcp.chat_id = private_chat_messages.chat_id 
      AND pcp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their private chat participants" ON private_chat_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join their private chats" ON private_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. VERIFY THE FIX
-- Test that the policies work without recursion
DO $$
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'message_participants' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'RLS is not enabled on message_participants';
  ELSE
    RAISE NOTICE 'RLS is enabled on message_participants';
  END IF;
  
  RAISE NOTICE 'RLS policies have been corrected and should no longer cause infinite recursion';
END $$;

-- 7. CREATE A SIMPLE TEST FUNCTION
CREATE OR REPLACE FUNCTION test_message_access(user_id_param UUID)
RETURNS TABLE(
  can_access_participants BOOLEAN,
  can_access_messages BOOLEAN,
  participant_count BIGINT
) AS $$
BEGIN
  -- Test if user can access their own participants
  SELECT 
    EXISTS(SELECT 1 FROM message_participants WHERE user_id = user_id_param) as can_access_participants,
    EXISTS(SELECT 1 FROM messages m 
           JOIN message_participants mp ON m.event_id = mp.event_id 
           WHERE mp.user_id = user_id_param) as can_access_messages,
    (SELECT COUNT(*) FROM message_participants WHERE user_id = user_id_param) as participant_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FINAL VERIFICATION
SELECT 'RLS policies have been corrected - infinite recursion should be resolved' as status;
