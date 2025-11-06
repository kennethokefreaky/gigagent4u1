-- COMPLETE FIX FOR OFFER NOTIFICATIONS
-- This fixes the missing promoter_id and event_id issue when accepting offers
-- Run this in your Supabase SQL editor

-- 1. Add missing columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS promoter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_title TEXT;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS offer_amount NUMERIC;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS notification_data TEXT;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_promoter_id ON public.notifications(promoter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_offer_amount ON public.notifications(offer_amount);

-- 3. Update the notification type constraint to include all offer types
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

-- 4. Add comments to explain the columns
COMMENT ON COLUMN public.notifications.promoter_id IS 'ID of the promoter who sent the offer';
COMMENT ON COLUMN public.notifications.event_id IS 'ID of the event the offer is for';
COMMENT ON COLUMN public.notifications.event_title IS 'Title of the event the offer is for';
COMMENT ON COLUMN public.notifications.offer_amount IS 'Amount of the offer in dollars';

-- 5. Verify the fix by checking the table structure
SELECT 'VERIFICATION: NOTIFICATIONS TABLE STRUCTURE' as section;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check if there are any existing offer notifications that need to be cleaned up
SELECT 'EXISTING OFFER NOTIFICATIONS' as section;

SELECT 
    id,
    type,
    title,
    message,
    promoter_id,
    event_id,
    event_title,
    created_at
FROM notifications 
WHERE type = 'offer_received'
ORDER BY created_at DESC
LIMIT 10;

