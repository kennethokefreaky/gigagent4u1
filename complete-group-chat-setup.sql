-- Complete Group Chat Setup
-- This script ensures all database components are in place for the group chat system

-- 1. Ensure messages table exists with proper structure
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure message_participants table exists with proper structure
CREATE TABLE IF NOT EXISTS public.message_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 3. Ensure message_read_status table exists
CREATE TABLE IF NOT EXISTS public.message_read_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON public.messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_participants_event_id ON public.message_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON public.message_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON public.message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON public.message_read_status(user_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages from events they participate in" ON public.messages;
CREATE POLICY "Users can view messages from events they participate in"
ON public.messages FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT event_id FROM public.message_participants 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages to events they participate in" ON public.messages;
CREATE POLICY "Users can send messages to events they participate in"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  event_id IN (
    SELECT event_id FROM public.message_participants 
    WHERE user_id = auth.uid()
  )
);

-- 7. Create RLS policies for message_participants
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

-- 8. Create RLS policies for message_read_status
DROP POLICY IF EXISTS "Users can view their read status" ON public.message_read_status;
CREATE POLICY "Users can view their read status"
ON public.message_read_status FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_read_status;
CREATE POLICY "Users can mark messages as read"
ON public.message_read_status FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 9. Ensure notifications table has the required fields for offers
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS promoter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_title TEXT;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_promoter_id ON public.notifications(promoter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(event_id);

-- Update the notification type check to include 'offer_received'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'first_event', 
  'new_message', 
  'location_based', 
  'event_posted', 
  'talent_accepted', 
  'verification_required', 
  'offer_received',
  'offer_accepted', 
  'offer_edited', 
  'breakfast_reminder', 
  'lunch_reminder', 
  'dinner_reminder',
  'application_received'
));

-- 10. Ensure candidates table exists for offer tracking
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  offer_amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  talent_name TEXT,
  talent_categories TEXT[],
  talent_location TEXT,
  talent_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for candidates table
CREATE INDEX IF NOT EXISTS idx_candidates_talent_id ON public.candidates(talent_id);
CREATE INDEX IF NOT EXISTS idx_candidates_promoter_id ON public.candidates(promoter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_event_id ON public.candidates(event_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);

-- Enable RLS on candidates table
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for candidates
DROP POLICY IF EXISTS "Users can view their own candidates" ON public.candidates;
CREATE POLICY "Users can view their own candidates"
ON public.candidates FOR SELECT
TO authenticated
USING (auth.uid() = talent_id OR auth.uid() = promoter_id);

DROP POLICY IF EXISTS "Users can insert candidates" ON public.candidates;
CREATE POLICY "Users can insert candidates"
ON public.candidates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = promoter_id);

DROP POLICY IF EXISTS "Users can update their own candidates" ON public.candidates;
CREATE POLICY "Users can update their own candidates"
ON public.candidates FOR UPDATE
TO authenticated
USING (auth.uid() = talent_id OR auth.uid() = promoter_id)
WITH CHECK (auth.uid() = talent_id OR auth.uid() = promoter_id);

-- Add comments
COMMENT ON TABLE public.messages IS 'Stores messages for group conversations in events';
COMMENT ON TABLE public.message_participants IS 'Tracks participants in group conversations';
COMMENT ON TABLE public.message_read_status IS 'Tracks read status of messages for users';
COMMENT ON TABLE public.notifications IS 'User notifications with support for offer-related fields';
COMMENT ON TABLE public.candidates IS 'Tracks talent candidates for events with offer details';
