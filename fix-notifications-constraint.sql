-- Fix notifications table constraint to allow all used notification types
-- Run this in Supabase SQL editor

-- First, check what constraint exists (using correct syntax for newer PostgreSQL)
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname LIKE '%notification%' 
AND contype = 'c';

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Create new constraint with all the notification types used in the codebase
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
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
  'offer_received',
  'offer_accepted',
  'offer_edited',
  'application_received'  -- This was missing!
));

-- Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Test inserting a notification with the previously failing type
INSERT INTO notifications (
  user_id, 
  type, 
  title, 
  message, 
  button_text, 
  icon, 
  is_read
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),  -- Use any user ID for test
  'application_received',
  'Test Notification',
  'This is a test',
  'View',
  '🎉',
  false
);

-- Clean up test record
DELETE FROM notifications WHERE title = 'Test Notification';

SELECT 'Notifications constraint fixed successfully!' as result;
