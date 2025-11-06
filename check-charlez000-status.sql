-- Check charlez000@gmail.com's offer status specifically
-- Run this in Supabase SQL Editor

-- 1. Check if charlez000@gmail.com has any accepted offers
SELECT 'CHARLEZ000 ACCEPTED OFFERS CHECK' as section;
SELECT 
  c.*,
  p.title as event_title,
  pr.full_name as promoter_name,
  pr.email as promoter_email,
  prof.full_name as talent_name,
  prof.email as talent_email
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr ON c.promoter_id = pr.id
LEFT JOIN profiles prof ON c.talent_id = prof.id
WHERE prof.email = 'charlez000@gmail.com' 
  AND c.status = 'accepted'
ORDER BY c.created_at DESC;

-- 2. Check all offers for charlez000@gmail.com (accepted, pending, declined)
SELECT 'CHARLEZ000 ALL OFFERS' as section;
SELECT 
  c.*,
  p.title as event_title,
  pr.full_name as promoter_name,
  pr.email as promoter_email,
  prof.full_name as talent_name,
  prof.email as talent_email
FROM candidates c
LEFT JOIN posts p ON c.event_id = p.id
LEFT JOIN profiles pr ON c.promoter_id = pr.id
LEFT JOIN profiles prof ON c.talent_id = prof.id
WHERE prof.email = 'charlez000@gmail.com'
ORDER BY c.created_at DESC;

-- 3. Check notifications for charlez000@gmail.com
SELECT 'CHARLEZ000 NOTIFICATIONS' as section;
SELECT 
  n.*,
  p.title as event_title,
  prof.email as talent_email
FROM notifications n
LEFT JOIN posts p ON n.event_id = p.id
LEFT JOIN profiles prof ON n.user_id = prof.id
WHERE prof.email = 'charlez000@gmail.com'
ORDER BY n.created_at DESC;

-- 4. Check if there are any unread offer notifications for charlez000@gmail.com
SELECT 'CHARLEZ000 UNREAD OFFER NOTIFICATIONS' as section;
SELECT 
  n.*,
  p.title as event_title,
  prof.email as talent_email
FROM notifications n
LEFT JOIN posts p ON n.event_id = p.id
LEFT JOIN profiles prof ON n.user_id = prof.id
WHERE prof.email = 'charlez000@gmail.com'
  AND n.type = 'offer_received'
  AND n.is_read = false
ORDER BY n.created_at DESC;

-- 5. Get charlez000@gmail.com's user ID
SELECT 'CHARLEZ000 USER ID' as section;
SELECT 
  id,
  email,
  full_name,
  created_at
FROM profiles 
WHERE email = 'charlez000@gmail.com';




