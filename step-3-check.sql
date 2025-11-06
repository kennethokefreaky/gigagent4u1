-- STEP 3: Check recent messages
SELECT 'Step 3 - Recent messages count?' as question, 
       COUNT(*) as answer 
FROM messages 
WHERE created_at > NOW() - INTERVAL '1 hour';
