-- TEST NOTIFICATION CREATION PROCESS
-- This script tests that new notifications are created with proper data
-- Run this AFTER running the cleanup script

-- 1. Test creating a sample notification with all required fields
SELECT 'TEST: Creating sample notification' as section;

INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    button_text,
    icon,
    is_read,
    promoter_id,
    event_id,
    event_title,
    offer_amount
) VALUES (
    (SELECT id FROM auth.users LIMIT 1), -- Use first user as talent
    'offer_received',
    'New Offer Received',
    'Test Promoter is offering $500 to join the event "Test Event". Do you accept?',
    'Accept Offer',
    '💰',
    false,
    (SELECT id FROM auth.users LIMIT 1), -- Use first user as promoter
    (SELECT id FROM posts LIMIT 1), -- Use first post as event
    'Test Event',
    500.00
);

-- 2. Verify the test notification was created properly
SELECT 'VERIFICATION: Test notification data' as section;

SELECT 
    id,
    type,
    title,
    message,
    promoter_id,
    event_id,
    event_title,
    offer_amount,
    created_at
FROM notifications 
WHERE type = 'offer_received'
AND message LIKE '%Test Promoter%'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Clean up the test notification
SELECT 'CLEANUP: Removing test notification' as section;

DELETE FROM notifications 
WHERE type = 'offer_received'
AND message LIKE '%Test Promoter%';

-- 4. Final verification
SELECT 'FINAL VERIFICATION: No test notifications remain' as section;

SELECT COUNT(*) as test_notifications_remaining
FROM notifications 
WHERE type = 'offer_received'
AND message LIKE '%Test Promoter%';






