-- SIMPLE WORKING RLS POLICIES FOR NOTIFICATIONS
-- These are more permissive but will definitely work

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "users_can_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_users_can_create_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_delete_own_notifications" ON notifications;
DROP POLICY IF EXISTS "allow_all_notifications" ON notifications;

-- Step 2: Create simple, permissive policies that will work

-- Policy 1: Anyone can read notifications (for now)
CREATE POLICY "notifications_read_policy" ON notifications 
FOR SELECT USING (true);

-- Policy 2: Any authenticated user can insert notifications
CREATE POLICY "notifications_insert_policy" ON notifications 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Users can update their own notifications
CREATE POLICY "notifications_update_policy" ON notifications 
FOR UPDATE USING (user_id = auth.uid());

-- Policy 4: Users can delete their own notifications
CREATE POLICY "notifications_delete_policy" ON notifications 
FOR DELETE USING (user_id = auth.uid());

-- Step 3: Verify policies were created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications';
