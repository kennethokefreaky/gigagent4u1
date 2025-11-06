-- Debug group chat creation for the current user
-- Run this in your Supabase SQL Editor

-- Check if the user has any message_participants records
SELECT 'User message_participants:' as info;
SELECT 
  mp.*,
  p.title as event_title,
  p.promoter_id
FROM message_participants mp
LEFT JOIN posts p ON mp.event_id = p.id
WHERE mp.user_id = '9c7908c5-9295-416d-bc7a-051fb05e6ded'
ORDER BY mp.joined_at DESC;

-- Check all message_participants for the event
SELECT 'All participants for events:' as info;
SELECT 
  mp.*,
  p.title as event_title,
  p.promoter_id,
  pr.full_name as promoter_name
FROM message_participants mp
LEFT JOIN posts p ON mp.event_id = p.id
LEFT JOIN profiles pr ON p.promoter_id = pr.id
ORDER BY mp.event_id, mp.joined_at;

-- Check if there are any messages in the system
SELECT 'All messages:' as info;
SELECT 
  m.*,
  p.title as event_title
FROM messages m
LEFT JOIN posts p ON m.event_id = p.id
ORDER BY m.created_at DESC;

-- Check candidates table to see if offer was accepted
SELECT 'Candidates (accepted offers):' as info;
SELECT 
  c.*,
  p.title as event_title
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
WHERE c.talent_id = '9c7908c5-9295-416d-bc7a-051fb05e6ded'
ORDER BY c.created_at DESC;
