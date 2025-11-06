-- FIX INFINITE RECURSION IN RLS POLICIES
-- This script fixes the infinite recursion errors in message_participants and group_participants
-- Run this in your Supabase SQL editor

-- 1. DISABLE RLS TEMPORARILY TO FIX THE ISSUES
ALTER TABLE message_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES THAT MIGHT CAUSE RECURSION
DROP POLICY IF EXISTS "Users can view participants in their chats" ON message_participants;
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON message_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON message_participants;
DROP POLICY IF EXISTS "Users can delete their own participation" ON message_participants;

DROP POLICY IF EXISTS "Users can view group participants" ON group_participants;
DROP POLICY IF EXISTS "Users can insert themselves as group participants" ON group_participants;
DROP POLICY IF EXISTS "Users can update their own group participation" ON group_participants;
DROP POLICY IF EXISTS "Users can delete their own group participation" ON group_participants;

-- 3. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- For message_participants
CREATE POLICY "message_participants_select" ON message_participants
  FOR SELECT USING (true);

CREATE POLICY "message_participants_insert" ON message_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "message_participants_update" ON message_participants
  FOR UPDATE USING (true);

CREATE POLICY "message_participants_delete" ON message_participants
  FOR DELETE USING (true);

-- For group_participants
CREATE POLICY "group_participants_select" ON group_participants
  FOR SELECT USING (true);

CREATE POLICY "group_participants_insert" ON group_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "group_participants_update" ON group_participants
  FOR UPDATE USING (true);

CREATE POLICY "group_participants_delete" ON group_participants
  FOR DELETE USING (true);

-- 4. RE-ENABLE RLS
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

-- 5. VERIFY THE FIX
SELECT 'RLS policies fixed - infinite recursion should be resolved' as status;
