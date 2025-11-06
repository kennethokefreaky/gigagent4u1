-- Audit script to check candidates tab and offer issues
-- Run this in Supabase SQL Editor to diagnose the problems

-- 1. Check if candidates table has data
SELECT 'CANDIDATES TABLE AUDIT' as section;
SELECT 
  c.*,
  p.title as event_title,
  pr.full_name as promoter_name,
  prof.full_name as talent_name
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr ON c.promoter_id = pr.id
LEFT JOIN profiles prof ON c.talent_id = prof.id
ORDER BY c.created_at DESC;

-- 2. Check notifications table for offer-related data
SELECT 'NOTIFICATIONS AUDIT' as section;
SELECT 
  n.*,
  p.title as event_title
FROM notifications n
LEFT JOIN posts p ON n.event_id = p.id
WHERE n.type IN ('offer_received', 'offer_accepted', 'talent_accepted')
ORDER BY n.created_at DESC;

-- 3. Check if there are any accepted offers that should show in candidates
SELECT 'ACCEPTED OFFERS AUDIT' as section;
SELECT 
  c.*,
  p.title as event_title,
  pr.full_name as promoter_name,
  prof.full_name as talent_name
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr ON c.promoter_id = pr.id
LEFT JOIN profiles prof ON c.talent_id = prof.id
WHERE c.status = 'accepted'
ORDER BY c.created_at DESC;

-- 4. Check for charlez000@gmail.com specifically
SELECT 'CHARLEZ000 AUDIT' as section;
SELECT 
  c.*,
  p.title as event_title,
  pr.full_name as promoter_name,
  prof.full_name as talent_name,
  prof.email as talent_email
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr ON c.promoter_id = pr.id
LEFT JOIN profiles prof ON c.talent_id = prof.id
WHERE prof.email LIKE '%charlez000%' OR c.talent_name LIKE '%charlez000%'
ORDER BY c.created_at DESC;

-- 5. Check notifications for charlez000
SELECT 'CHARLEZ000 NOTIFICATIONS' as section;
SELECT 
  n.*,
  p.title as event_title,
  prof.email as talent_email
FROM notifications n
LEFT JOIN posts p ON n.event_id = p.id
LEFT JOIN profiles prof ON n.user_id = prof.id
WHERE prof.email LIKE '%charlez000%' OR n.message LIKE '%charlez000%'
ORDER BY n.created_at DESC;

-- 6. Check if there are any group events (posts) that should have candidates
SELECT 'GROUP EVENTS AUDIT' as section;
SELECT 
  p.*,
  pr.full_name as promoter_name,
  COUNT(c.id) as candidate_count
FROM posts p
LEFT JOIN profiles pr ON p.promoter_id = pr.id
LEFT JOIN candidates c ON p.id = c.event_id
GROUP BY p.id, pr.full_name
ORDER BY p.created_at DESC;

-- 7. Check message_participants for group chats
SELECT 'MESSAGE PARTICIPANTS AUDIT' as section;
SELECT 
  mp.*,
  p.title as event_title,
  prof.full_name as participant_name,
  prof.email as participant_email
FROM message_participants mp
LEFT JOIN posts p ON mp.event_id = p.id
LEFT JOIN profiles prof ON mp.user_id = prof.id
ORDER BY mp.joined_at DESC;

