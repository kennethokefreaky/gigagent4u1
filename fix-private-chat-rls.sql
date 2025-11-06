-- Fix RLS policies for private chat system
-- This allows users to access private chats even if the other participant hasn't joined yet

-- Update RLS policy for private_chat_messages to allow access only for specific chat participants
DROP POLICY IF EXISTS "Users can view messages from their private chats" ON public.private_chat_messages;
CREATE POLICY "Users can view messages from their private chats"
ON public.private_chat_messages FOR SELECT
TO authenticated
USING (
  -- User can see messages if they are a participant in the chat
  chat_id IN (
    SELECT chat_id FROM public.private_chat_participants 
    WHERE user_id = auth.uid()
  )
  OR
  -- Allow access if the chat_id contains the user's ID (talent at start, promoter at end)
  (chat_id LIKE auth.uid()::text || '-%' OR chat_id LIKE '%-' || auth.uid()::text)
);

-- Update RLS policy for private_chat_participants to allow users to see participants in their chats
DROP POLICY IF EXISTS "Users can view their private chat participants" ON public.private_chat_participants;
CREATE POLICY "Users can view their private chat participants"
ON public.private_chat_participants FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  chat_id LIKE auth.uid()::text || '-%'
  OR
  chat_id LIKE '%-' || auth.uid()::text
);

-- Update RLS policy for private_chat_participants to allow users to insert themselves into chats
DROP POLICY IF EXISTS "Users can join private chats" ON public.private_chat_participants;
CREATE POLICY "Users can join private chats"
ON public.private_chat_participants FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND (
    -- Allow if chat_id starts with user's ID (talent creating chat)
    chat_id LIKE auth.uid()::text || '-%'
    OR
    -- Allow if chat_id ends with user's ID (promoter joining chat)
    chat_id LIKE '%-' || auth.uid()::text
  )
);

-- Update RLS policy for private_chat_participants to allow users to update their own participation
DROP POLICY IF EXISTS "Users can update their private chat status" ON public.private_chat_participants;
CREATE POLICY "Users can update their private chat status"
ON public.private_chat_participants FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  AND (
    chat_id LIKE auth.uid()::text || '-%'
    OR
    chat_id LIKE '%-' || auth.uid()::text
  )
)
WITH CHECK (
  user_id = auth.uid() 
  AND (
    chat_id LIKE auth.uid()::text || '-%'
    OR
    chat_id LIKE '%-' || auth.uid()::text
  )
);

-- Add comments
COMMENT ON TABLE public.private_chat_messages IS 'Stores messages for private 1-on-1 chats between talent and promoters - updated RLS policies';
COMMENT ON TABLE public.private_chat_participants IS 'Tracks participants in private chats - updated RLS policies';
