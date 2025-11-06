-- Create private chat messages table
-- This table stores messages for private 1-on-1 chats between talent and promoters

-- Create the private_chat_messages table
CREATE TABLE IF NOT EXISTS public.private_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL, -- Format: talentId-promoterId
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_private_chat_messages_chat_id ON public.private_chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_messages_sender_id ON public.private_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_messages_created_at ON public.private_chat_messages(created_at);

-- Create private chat participants table
CREATE TABLE IF NOT EXISTS public.private_chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL, -- Format: talentId-promoterId
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id) -- Ensure each user can only be in a chat once
);

-- Create indexes for private chat participants
CREATE INDEX IF NOT EXISTS idx_private_chat_participants_chat_id ON public.private_chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_participants_user_id ON public.private_chat_participants(user_id);

-- Enable RLS on both tables
ALTER TABLE public.private_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_chat_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for private_chat_messages
DROP POLICY IF EXISTS "Users can view messages from their private chats" ON public.private_chat_messages;
CREATE POLICY "Users can view messages from their private chats"
ON public.private_chat_messages FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id FROM public.private_chat_participants 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages to their private chats" ON public.private_chat_messages;
CREATE POLICY "Users can send messages to their private chats"
ON public.private_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  chat_id IN (
    SELECT chat_id FROM public.private_chat_participants 
    WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for private_chat_participants
DROP POLICY IF EXISTS "Users can view their private chat participants" ON public.private_chat_participants;
CREATE POLICY "Users can view their private chat participants"
ON public.private_chat_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can join private chats" ON public.private_chat_participants;
CREATE POLICY "Users can join private chats"
ON public.private_chat_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their private chat status" ON public.private_chat_participants;
CREATE POLICY "Users can update their private chat status"
ON public.private_chat_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE public.private_chat_messages IS 'Stores messages for private 1-on-1 chats between talent and promoters';
COMMENT ON TABLE public.private_chat_participants IS 'Tracks participants in private chats';

-- Create function to get private chat messages
CREATE OR REPLACE FUNCTION get_private_chat_messages(chat_id_param TEXT, user_id_param UUID)
RETURNS TABLE (
  id UUID,
  chat_id TEXT,
  sender_id UUID,
  message_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  sender_name TEXT,
  sender_avatar TEXT
) AS $$
BEGIN
  -- Check if user is a participant in this chat
  IF NOT EXISTS (
    SELECT 1 FROM public.private_chat_participants 
    WHERE chat_id = chat_id_param AND user_id = user_id_param
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this chat';
  END IF;

  -- Return messages with sender info
  RETURN QUERY
  SELECT 
    pcm.id,
    pcm.chat_id,
    pcm.sender_id,
    pcm.message_text,
    pcm.created_at,
    pcm.updated_at,
    p.full_name as sender_name,
    p.profile_image_url as sender_avatar
  FROM public.private_chat_messages pcm
  LEFT JOIN public.profiles p ON pcm.sender_id = p.id
  WHERE pcm.chat_id = chat_id_param
  ORDER BY pcm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send private chat message
CREATE OR REPLACE FUNCTION send_private_chat_message(
  chat_id_param TEXT,
  sender_id_param UUID,
  message_text_param TEXT
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Check if sender is a participant in this chat
  IF NOT EXISTS (
    SELECT 1 FROM public.private_chat_participants 
    WHERE chat_id = chat_id_param AND user_id = sender_id_param
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this chat';
  END IF;

  -- Insert the message
  INSERT INTO public.private_chat_messages (chat_id, sender_id, message_text)
  VALUES (chat_id_param, sender_id_param, message_text_param)
  RETURNING id INTO message_id;

  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to join private chat
CREATE OR REPLACE FUNCTION join_private_chat(
  chat_id_param TEXT,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert participant if not already exists
  INSERT INTO public.private_chat_participants (chat_id, user_id)
  VALUES (chat_id_param, user_id_param)
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
