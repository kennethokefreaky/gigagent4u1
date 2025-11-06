-- STEP 1: Check if trigger exists
SELECT 'Step 1 - Trigger exists?' as question, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.triggers 
         WHERE trigger_name = 'create_group_message_notification'
       ) THEN 'YES' ELSE 'NO' END as answer;
