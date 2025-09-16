-- Update notifications table to include message-related notification types
-- This script updates the existing notifications table to support messaging notifications

-- First, drop the existing constraint if it exists
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with all notification types including message-related ones
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'first_event', 
  'new_message', 
  'location_based', 
  'event_posted', 
  'talent_accepted', 
  'verification_required',
  'breakfast_reminder',
  'lunch_reminder',
  'dinner_reminder',
  'message_received',
  'group_message'
));

-- Add comment to document the new notification types
COMMENT ON CONSTRAINT notifications_type_check ON notifications IS 
'Notification types: first_event, new_message, location_based, event_posted, talent_accepted, verification_required, breakfast_reminder, lunch_reminder, dinner_reminder, message_received, group_message';

-- Create an index for message-related notifications for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_message_types ON notifications(type) 
WHERE type IN ('new_message', 'message_received', 'group_message');
