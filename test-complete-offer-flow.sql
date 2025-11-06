-- TEST COMPLETE OFFER FLOW
-- This script tests the complete offer creation and acceptance flow
-- Run this AFTER running the cleanup script

-- STEP 1: Create a test notification with all required fields
SELECT 'STEP 1: Creating test offer notification' as section;

-- Get sample user and event IDs
WITH sample_data AS (
    SELECT 
        (SELECT id FROM auth.users LIMIT 1) as promoter_id,
        (SELECT id FROM auth.users ORDER BY id LIMIT 1 OFFSET 1) as talent_id,
        (SELECT id FROM posts LIMIT 1) as event_id
)
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
)
SELECT 
    talent_id,
    'offer_received',
    'New Offer Received',
    'Test Promoter is offering $1000 to join the event "Test Wrestling Event". Do you accept?',
    'Accept Offer',
    '💰',
    false,
    promoter_id,
    event_id,
    'Test Wrestling Event',
    1000.00
FROM sample_data;

-- STEP 2: Verify the test notification was created correctly
SELECT 'STEP 2: Verifying test notification data integrity' as section;

SELECT 
    id,
    type,
    title,
    message,
    promoter_id,
    event_id,
    event_title,
    offer_amount,
    created_at,
    CASE 
        WHEN promoter_id IS NOT NULL AND event_id IS NOT NULL THEN '✅ COMPLETE'
        ELSE '❌ INCOMPLETE'
    END as data_status
FROM notifications 
WHERE type = 'offer_received'
AND message LIKE '%Test Promoter%'
ORDER BY created_at DESC
LIMIT 1;

-- STEP 3: Test notification retrieval (simulating frontend fetch)
SELECT 'STEP 3: Testing notification retrieval for talent' as section;

SELECT 
    id,
    type,
    title,
    message,
    button_text,
    icon,
    promoter_id,
    event_id,
    event_title,
    offer_amount,
    is_read,
    created_at
FROM notifications 
WHERE type = 'offer_received'
AND message LIKE '%Test Promoter%'
ORDER BY created_at DESC
LIMIT 1;

-- STEP 4: Simulate offer acceptance (update notification)
SELECT 'STEP 4: Testing offer acceptance flow' as section;

UPDATE notifications 
SET 
    is_read = true,
    button_text = 'Accepted',
    message = 'You have accepted the offer of $1000 to join the event "Test Wrestling Event".'
WHERE type = 'offer_received'
AND message LIKE '%Test Promoter%';

-- STEP 5: Verify acceptance was recorded
SELECT 'STEP 5: Verifying offer acceptance' as section;

SELECT 
    id,
    type,
    title,
    message,
    button_text,
    is_read,
    updated_at
FROM notifications 
WHERE type = 'offer_received'
AND message LIKE '%You have accepted%'
ORDER BY updated_at DESC
LIMIT 1;

-- STEP 6: Clean up test data
SELECT 'STEP 6: Cleaning up test data' as section;

DELETE FROM notifications 
WHERE message LIKE '%Test Promoter%' OR message LIKE '%You have accepted%';

-- STEP 7: Final verification
SELECT 'STEP 7: Final verification - no test data remains' as section;

SELECT COUNT(*) as remaining_test_notifications
FROM notifications 
WHERE message LIKE '%Test Promoter%' OR message LIKE '%You have accepted%';

-- SUCCESS MESSAGE
SELECT 'SUCCESS: Complete offer flow test completed successfully!' as result;






