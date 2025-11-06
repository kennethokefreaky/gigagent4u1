-- Fix Group Chat Participants Schema
-- This ensures proper relationships and only includes invited talents

-- 1. Ensure message_participants table has proper structure
CREATE TABLE IF NOT EXISTS public.message_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_participants_event_id ON public.message_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON public.message_participants(user_id);

-- 3. Enable RLS on message_participants
ALTER TABLE public.message_participants ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for message_participants
DROP POLICY IF EXISTS "Users can view participants in their events" ON public.message_participants;
CREATE POLICY "Users can view participants in their events"
ON public.message_participants FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  event_id IN (
    SELECT id FROM posts WHERE promoter_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can join events they're invited to" ON public.message_participants;
CREATE POLICY "Users can join events they're invited to"
ON public.message_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their participation" ON public.message_participants;
CREATE POLICY "Users can update their participation"
ON public.message_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Create a function to get group chat participants with profile info
CREATE OR REPLACE FUNCTION get_group_chat_participants(event_id_param UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  profile_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.user_id,
    p.full_name,
    p.profile_image_url
  FROM public.message_participants mp
  LEFT JOIN public.profiles p ON mp.user_id = p.id
  WHERE mp.event_id = event_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a function to get only accepted candidates for an event
CREATE OR REPLACE FUNCTION get_accepted_candidates_for_event(event_id_param UUID)
RETURNS TABLE (
  talent_id UUID,
  full_name TEXT,
  profile_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.talent_id,
    p.full_name,
    p.profile_image_url
  FROM public.candidates c
  LEFT JOIN public.profiles p ON c.talent_id = p.id
  WHERE c.event_id = event_id_param 
    AND c.status = 'accepted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add comments
COMMENT ON TABLE public.message_participants IS 'Tracks participants in event group chats - only invited talents';
COMMENT ON FUNCTION get_group_chat_participants(UUID) IS 'Returns group chat participants with profile info';
COMMENT ON FUNCTION get_accepted_candidates_for_event(UUID) IS 'Returns only accepted candidates for an event';

-- 8. Create a view for easier querying of group chat participants with profiles
CREATE OR REPLACE VIEW group_chat_participants_with_profiles AS
SELECT 
  mp.id,
  mp.event_id,
  mp.user_id,
  mp.joined_at,
  mp.last_read_at,
  p.full_name,
  p.profile_image_url
FROM public.message_participants mp
LEFT JOIN public.profiles p ON mp.user_id = p.id;

-- Add comment for the view
COMMENT ON VIEW group_chat_participants_with_profiles IS 'View of group chat participants with profile information';
