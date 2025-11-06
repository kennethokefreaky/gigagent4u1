-- Debug private chat creation
-- Run this in your Supabase SQL Editor

-- Check ALL message_participants records for the user
SELECT 'All message_participants for user:' as info;
SELECT 
  mp.*,
  p.title as event_title,
  p.promoter_id,
  pr.full_name as promoter_name
FROM message_participants mp
LEFT JOIN posts p ON mp.event_id = p.id
LEFT JOIN profiles pr ON p.promoter_id = pr.id
WHERE mp.user_id = '9c7908c5-9295-416d-bc7a-051fb05e6ded'
ORDER BY mp.joined_at DESC;

-- Check if there are any message_participants WITHOUT event_id (private chats)
SELECT 'Private chats (no event_id):' as info;
SELECT 
  mp.*,
  pr.full_name as promoter_name
FROM message_participants mp
LEFT JOIN profiles pr ON mp.user_id = pr.id
WHERE mp.user_id = '9c7908c5-9295-416d-bc7a-051fb05e6ded'
  AND mp.event_id IS NULL
ORDER BY mp.joined_at DESC;

-- Check chat_subscriptions table
SELECT 'Chat subscriptions:' as info;
SELECT * FROM chat_subscriptions 
WHERE user_id = '9c7908c5-9295-416d-bc7a-051fb05e6ded'
ORDER BY created_at DESC;
