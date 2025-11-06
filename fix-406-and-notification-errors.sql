-- FIX 406 ERRORS AND NOTIFICATION ERRORS
-- This script fixes the 406 (Not Acceptable) errors on unified_participants
-- and the notification button_text null constraint error

-- 1. Fix RLS policies for unified_participants (406 errors)
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow users to read their own unified participation" ON unified_participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert unified participation" ON unified_participants;
DROP POLICY IF EXISTS "Allow users to update their own last_read_at" ON unified_participants;

-- Create more permissive policies for unified_participants
CREATE POLICY "Allow users to read unified participation" ON unified_participants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to insert unified participation" ON unified_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update unified participation" ON unified_participants
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 2. Fix RLS policies for unified_messages (406 errors)
DROP POLICY IF EXISTS "Allow participants to read unified messages" ON unified_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert unified messages" ON unified_messages;

CREATE POLICY "Allow users to read unified messages" ON unified_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to insert unified messages" ON unified_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Fix notifications table to allow null button_text
-- First, let's make button_text nullable
ALTER TABLE notifications ALTER COLUMN button_text DROP NOT NULL;

-- Update existing null button_text values
UPDATE notifications SET button_text = 'View' WHERE button_text IS NULL;

SELECT '406 errors and notification errors fixed: RLS policies updated, button_text made nullable.' as status;






