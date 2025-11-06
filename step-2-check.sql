-- STEP 2: Check if function exists
SELECT 'Step 2 - Function exists?' as question, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.routines 
         WHERE routine_name = 'create_group_message_notification'
       ) THEN 'YES' ELSE 'NO' END as answer;
