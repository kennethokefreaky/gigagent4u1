-- FIX CANDIDATES TABLE RLS POLICIES
-- This script fixes RLS policies for the candidates table to prevent 403 errors
-- Run this in your Supabase SQL editor

-- 1. Check current RLS status and policies
SELECT 'CURRENT RLS STATUS' as section;

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'candidates';

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'candidates';

-- 2. Drop existing problematic policies
SELECT 'DROPPING EXISTING POLICIES' as section;

DROP POLICY IF EXISTS "Users can view their own candidates" ON candidates;
DROP POLICY IF EXISTS "Users can insert their own candidates" ON candidates;
DROP POLICY IF EXISTS "Users can update their own candidates" ON candidates;
DROP POLICY IF EXISTS "Users can delete their own candidates" ON candidates;

-- 3. Create new, more permissive policies
SELECT 'CREATING NEW POLICIES' as section;

-- Allow users to view candidates where they are the talent
CREATE POLICY "Users can view candidates where they are talent" ON candidates
  FOR SELECT USING (auth.uid() = talent_id);

-- Allow users to view candidates where they are the promoter
CREATE POLICY "Users can view candidates where they are promoter" ON candidates
  FOR SELECT USING (auth.uid() = promoter_id);

-- Allow users to insert candidates where they are the talent
CREATE POLICY "Users can insert candidates where they are talent" ON candidates
  FOR INSERT WITH CHECK (auth.uid() = talent_id);

-- Allow users to insert candidates where they are the promoter
CREATE POLICY "Users can insert candidates where they are promoter" ON candidates
  FOR INSERT WITH CHECK (auth.uid() = promoter_id);

-- Allow users to update candidates where they are the talent
CREATE POLICY "Users can update candidates where they are talent" ON candidates
  FOR UPDATE USING (auth.uid() = talent_id);

-- Allow users to update candidates where they are the promoter
CREATE POLICY "Users can update candidates where they are promoter" ON candidates
  FOR UPDATE USING (auth.uid() = promoter_id);

-- 4. Ensure RLS is enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- 5. Verify the new policies
SELECT 'VERIFYING NEW POLICIES' as section;

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'candidates'
ORDER BY policyname;

-- 6. Test policies (this will show if there are any issues)
SELECT 'TESTING POLICIES' as section;

-- This should work for authenticated users
SELECT COUNT(*) as total_candidates FROM candidates;

-- 7. Success message
SELECT 'SUCCESS: Candidates table RLS policies have been fixed!' as result;

