-- Complete fix for offer system
-- This ensures all tables and columns exist for the offer acceptance flow

-- 1. Fix notifications table to add missing offer-related fields
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS promoter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_title TEXT;

-- Create indexes for better performance
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

-- 2. Ensure candidates table exists with proper structure
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

-- 3. Ensure message_participants table exists for group chats
CREATE TABLE IF NOT EXISTS public.message_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create indexes for message_participants
CREATE INDEX IF NOT EXISTS idx_message_participants_event_id ON public.message_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON public.message_participants(user_id);

-- Enable RLS on message_participants
ALTER TABLE public.message_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for message_participants
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

-- Add comments
COMMENT ON TABLE public.notifications IS 'User notifications with support for offer-related fields';
COMMENT ON TABLE public.candidates IS 'Tracks talent candidates for events with offer details';
COMMENT ON TABLE public.message_participants IS 'Tracks participants in event group chats';
