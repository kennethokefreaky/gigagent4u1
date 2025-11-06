-- Add missing columns to notifications table for offer functionality
-- This fixes the 400 Bad Request error when trying to fetch notification data

-- Add promoter_id column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS promoter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add event_id column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES posts(id) ON DELETE CASCADE;

-- Add event_title column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_title TEXT;

-- Add offer_amount column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS offer_amount NUMERIC;

-- Add notification_data column if it doesn't exist (for additional metadata)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS notification_data TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_promoter_id ON public.notifications(promoter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_offer_amount ON public.notifications(offer_amount);

-- Update the notification type check to include 'counter_offer'
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
  'counter_offer',
  'breakfast_reminder', 
  'lunch_reminder', 
  'dinner_reminder',
  'application_received'
));

-- Add comments to explain the columns
COMMENT ON COLUMN public.notifications.promoter_id IS 'ID of the promoter who sent the offer';
COMMENT ON COLUMN public.notifications.event_id IS 'ID of the event the offer is for';
COMMENT ON COLUMN public.notifications.event_title IS 'Title of the event the offer is for';
COMMENT ON COLUMN public.notifications.offer_amount IS 'Amount of the offer in dollars';
COMMENT ON COLUMN public.notifications.notification_data IS 'JSON string containing additional notification metadata';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications' 
AND column_name IN ('promoter_id', 'event_id', 'event_title', 'offer_amount', 'notification_data')
ORDER BY column_name;

