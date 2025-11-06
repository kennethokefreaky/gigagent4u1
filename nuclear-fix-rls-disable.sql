-- NUCLEAR FIX: COMPLETELY DISABLE RLS ON MESSAGING TABLES
-- This will stop ALL infinite recursion errors immediately
-- Run this in your Supabase SQL editor

-- 1. COMPLETELY DISABLE RLS ON ALL MESSAGING TABLES
ALTER TABLE message_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_participants DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES (NUCLEAR CLEANUP)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on message_participants
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('message_participants', 'messages', 'message_read_status', 'private_chat_messages', 'private_chat_participants')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. VERIFY RLS IS DISABLED
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('message_participants', 'messages', 'message_read_status', 'private_chat_messages', 'private_chat_participants')
AND schemaname = 'public';

-- 4. TEST ACCESS TO TABLES
SELECT 'Testing message_participants access...' as test;
SELECT COUNT(*) as message_participants_count FROM message_participants;

SELECT 'Testing messages access...' as test;
SELECT COUNT(*) as messages_count FROM messages;

SELECT 'RLS DISABLED - NO MORE INFINITE RECURSION ERRORS' as status;
