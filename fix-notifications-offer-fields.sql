-- Fix notifications table to add missing offer-related fields
-- This ensures offer notifications can store promoter_id and event_id

-- Add promoter_id column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS promoter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add event_id column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES posts(id) ON DELETE CASCADE;

-- Add event_title column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_title TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_promoter_id ON public.notifications(promoter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(event_id);

-- Add comments
COMMENT ON COLUMN public.notifications.promoter_id IS 'ID of the promoter who sent the offer';
COMMENT ON COLUMN public.notifications.event_id IS 'ID of the event the offer is for';
COMMENT ON COLUMN public.notifications.event_title IS 'Title of the event the offer is for';

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

-- Add comment to explain the fix
COMMENT ON TABLE public.notifications IS 'User notifications with support for offer-related fields';
