-- Fix notifications table to add missing data column
-- This fixes the "Could not find the 'data' column of 'notifications'" error

-- Add the data column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS data JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN public.notifications.data IS 'JSON data containing event-specific information (event_id, talent_id, application_id, etc.)';

-- Create index for better performance on data queries
CREATE INDEX IF NOT EXISTS idx_notifications_data ON public.notifications USING GIN (data);

-- Update the notification type check to include 'application_received'
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

-- Test the fix by inserting a sample notification
INSERT INTO public.notifications (
  user_id, 
  type, 
  title, 
  message, 
  button_text, 
  icon, 
  data
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Use first user as test
  'application_received',
  'Test Notification',
  'This is a test notification',
  'View',
  'bell',
  '{"test": true}'::jsonb
) ON CONFLICT DO NOTHING;

-- Clean up the test notification
DELETE FROM public.notifications WHERE title = 'Test Notification';

-- Add comment to explain the fix
COMMENT ON TABLE public.notifications IS 'User notifications with JSON data support for event-specific information';
