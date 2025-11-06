-- FIX UNIFIED MESSAGES RLS POLICIES
-- This will fix the 406 error by ensuring proper RLS policies
-- Run this in your Supabase SQL editor

-- 1. CHECK CURRENT RLS STATUS
SELECT 'CURRENT RLS STATUS' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('unified_messages', 'unified_participants')
ORDER BY tablename;

-- 2. CHECK CURRENT RLS POLICIES
SELECT 'CURRENT RLS POLICIES' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('unified_messages', 'unified_participants')
ORDER BY tablename, policyname;

-- 3. DROP EXISTING PROBLEMATIC POLICIES
SELECT 'DROPPING PROBLEMATIC POLICIES' as section;
DROP POLICY IF EXISTS "Users can view their own unified messages" ON unified_messages;
DROP POLICY IF EXISTS "Users can view their own unified participants" ON unified_participants;
DROP POLICY IF EXISTS "Users can insert their own unified messages" ON unified_messages;
DROP POLICY IF EXISTS "Users can insert their own unified participants" ON unified_participants;

-- 4. CREATE SIMPLE, WORKING POLICIES
SELECT 'CREATING SIMPLE POLICIES' as section;

-- Allow users to view their own unified messages
CREATE POLICY "Users can view their own unified messages" ON unified_messages
FOR SELECT USING (
    conversation_id IN (
        SELECT conversation_id 
        FROM unified_participants 
        WHERE user_id = auth.uid()
    )
);

-- Allow users to view their own unified participants
CREATE POLICY "Users can view their own unified participants" ON unified_participants
FOR SELECT USING (user_id = auth.uid());

-- Allow users to insert their own unified messages
CREATE POLICY "Users can insert their own unified messages" ON unified_messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Allow users to insert their own unified participants
CREATE POLICY "Users can insert their own unified participants" ON unified_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5. VERIFY POLICIES ARE CREATED
SELECT 'VERIFYING POLICIES' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('unified_messages', 'unified_participants')
ORDER BY tablename, policyname;
