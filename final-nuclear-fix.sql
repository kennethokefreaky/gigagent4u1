-- FINAL NUCLEAR FIX - STOP ALL INFINITE RECURSION
-- This will completely disable RLS on ALL messaging tables
-- Run this in your Supabase SQL editor

-- 1. COMPLETELY DISABLE RLS ON ALL MESSAGING TABLES
ALTER TABLE message_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE unified_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE unified_participants DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES (NUCLEAR CLEANUP)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN (
            'message_participants', 
            'messages', 
            'message_read_status', 
            'private_chat_messages', 
            'private_chat_participants',
            'unified_messages',
            'unified_participants'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. VERIFY RLS IS COMPLETELY DISABLED
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN (
    'message_participants', 
    'messages', 
    'message_read_status', 
    'private_chat_messages', 
    'private_chat_participants',
    'unified_messages',
    'unified_participants'
)
AND schemaname = 'public';

-- 4. TEST ACCESS TO ALL TABLES
SELECT 'Testing all messaging tables...' as test;

SELECT 'message_participants' as table_name, COUNT(*) as count FROM message_participants
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM messages
UNION ALL
SELECT 'unified_participants' as table_name, COUNT(*) as count FROM unified_participants
UNION ALL
SELECT 'unified_messages' as table_name, COUNT(*) as count FROM unified_messages;

SELECT 'RLS COMPLETELY DISABLED - NO MORE INFINITE RECURSION' as status;
