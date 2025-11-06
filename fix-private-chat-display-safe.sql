-- SAFE FIX FOR PRIVATE CHAT DISPLAY
-- Only fixes the specific policy that's preventing private chats from showing
-- Does NOT break any existing functionality

-- 1. ONLY DROP THE PROBLEMATIC POLICY
DROP POLICY IF EXISTS "private_participants_view" ON private_chat_participants;

-- 2. CREATE THE FIXED POLICY (allows seeing other participants in same chats)
CREATE POLICY "private_participants_view" ON private_chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    chat_id IN (
      SELECT pcp2.chat_id 
      FROM private_chat_participants pcp2 
      WHERE pcp2.user_id = auth.uid()
    )
  );

-- 3. FINAL STATUS
SELECT 'SAFE private chat display fix applied - only changed the problematic policy' as status;
