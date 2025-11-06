-- Fix the candidates table debug with proper UUIDs
-- Run this in your Supabase SQL Editor

-- First, let's see what UUIDs exist in the system
SELECT 'Available User IDs:' as info;
SELECT id, email FROM auth.users LIMIT 5;

SELECT 'Available Event IDs:' as info;
SELECT id, title FROM posts LIMIT 5;

-- Now try to insert a test candidate record with proper UUIDs
-- We'll use the first available user and event IDs
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
) 
SELECT 
  '9c7908c5-9295-416d-bc7a-051fb05e6ded'::uuid, -- talent_id from debug log
  (SELECT id FROM auth.users WHERE id != '9c7908c5-9295-416d-bc7a-051fb05e6ded' LIMIT 1)::uuid, -- any other user as promoter
  (SELECT id FROM posts LIMIT 1)::uuid, -- any event
  'Test Event',
  '1000',
  'accepted',
  'Test Talent',
  ARRAY['Boxer'],
  'Test Location',
  'https://example.com/image.jpg'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id != '9c7908c5-9295-416d-bc7a-051fb05e6ded')
  AND EXISTS (SELECT 1 FROM posts);

-- Check if the insert worked
SELECT 'Test candidate created:' as info;
SELECT * FROM candidates WHERE talent_id = '9c7908c5-9295-416d-bc7a-051fb05e6ded';

-- Check all candidates
SELECT 'All candidates:' as info;
SELECT * FROM candidates;
