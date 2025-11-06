-- CORRECT RLS POLICIES FOR NOTIFICATIONS TABLE
-- These policies are secure but allow cross-user notifications

-- Step 1: Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to start clean
DROP POLICY IF EXISTS "allow_all_notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

-- Step 3: Create secure but functional policies

-- Policy 1: Users can view notifications sent to them
CREATE POLICY "users_can_view_own_notifications" ON notifications 
FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Authenticated users can create notifications for any user
-- This allows promoters to send notifications to talent users
CREATE POLICY "authenticated_users_can_create_notifications" ON notifications 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Users can update notifications sent to them (mark as read, etc.)
CREATE POLICY "users_can_update_own_notifications" ON notifications 
FOR UPDATE USING (user_id = auth.uid());

-- Policy 4: Users can delete notifications sent to them
CREATE POLICY "users_can_delete_own_notifications" ON notifications 
FOR DELETE USING (user_id = auth.uid());

-- Step 4: Verify the policies were created
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
WHERE tablename = 'notifications'
ORDER BY policyname;
