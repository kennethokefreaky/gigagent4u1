-- Update notifications table to include new notification types
-- Run this in your Supabase SQL editor if the notifications table already exists

-- First, drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new check constraint with all notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('first_event', 'new_message', 'location_based', 'event_posted', 'talent_accepted', 'verification_required', 'offer_received', 'offer_accepted', 'offer_edited', 'breakfast_reminder', 'lunch_reminder', 'dinner_reminder'));

-- Reload the schema to ensure changes take effect
NOTIFY pgrst, 'reload schema';