-- TEMPORARILY DISABLE RLS FOR DEVELOPMENT
-- This will allow the app to work while we debug the RLS policies
-- ⚠️ WARNING: This removes security - only use for development!

-- Disable RLS on all message-related tables
ALTER TABLE message_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('message_participants', 'messages', 'message_read_status', 'candidates', 'notifications')
ORDER BY tablename;
