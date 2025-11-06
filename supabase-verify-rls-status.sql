-- Verify RLS status on all tables
-- Run this to check if RLS is actually disabled

SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('message_participants', 'messages', 'message_read_status', 'candidates', 'notifications')
ORDER BY tablename;

-- Also check if there are any policies still active
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename IN ('message_participants', 'messages', 'message_read_status', 'candidates', 'notifications')
ORDER BY tablename, policyname;
