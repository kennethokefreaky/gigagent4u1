-- Debug the candidates table to see what's wrong
-- Run this in your Supabase SQL Editor

-- Check if candidates table exists and its structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'candidates' 
ORDER BY ordinal_position;

-- Check if there are any constraints on candidates table
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'candidates'::regclass;

-- Check if there are any triggers on candidates table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'candidates';

-- Try to insert a test candidate record manually
INSERT INTO candidates (
  talent_id,
  promoter_id, 
  event_id,
  event_title,
  offer_amount,
  status,
  talent_name,
  talent_categories,
  talent_location,
  talent_image_url
) VALUES (
  '9c7908c5-9295-416d-bc7a-051fb05e6ded', -- talent_id from debug log
  'test-promoter-id', -- placeholder promoter_id
  'test-event-id', -- placeholder event_id
  'Test Event',
  '1000',
  'accepted',
  'Test Talent',
  ARRAY['Boxer'],
  'Test Location',
  'https://example.com/image.jpg'
);

-- Check if the insert worked
SELECT * FROM candidates WHERE talent_id = '9c7908c5-9295-416d-bc7a-051fb05e6ded';
