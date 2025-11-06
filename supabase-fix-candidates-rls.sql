-- Fix RLS policies for candidates table to allow talent users to create candidates
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Promoters can view their own candidates" ON candidates;
DROP POLICY IF EXISTS "Talents can view their own candidates" ON candidates;
DROP POLICY IF EXISTS "Promoters can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Promoters can update their own candidates" ON candidates;

-- Step 2: Create new policies that allow both promoters and talents to work with candidates

-- Policy 1: Promoters can view their own candidates
CREATE POLICY "Promoters can view their own candidates" ON candidates 
FOR SELECT USING (promoter_id = auth.uid());

-- Policy 2: Talents can view candidates where they are the talent
CREATE POLICY "Talents can view their own candidates" ON candidates 
FOR SELECT USING (talent_id = auth.uid());

-- Policy 3: Both promoters and talents can insert candidates
-- This allows talent to create candidate record when accepting offer
-- and promoters to create candidate records when needed
CREATE POLICY "Users can insert candidates" ON candidates 
FOR INSERT WITH CHECK (
  promoter_id = auth.uid() OR 
  talent_id = auth.uid()
);

-- Policy 4: Promoters can update their own candidates
CREATE POLICY "Promoters can update their own candidates" ON candidates 
FOR UPDATE USING (promoter_id = auth.uid());

-- Policy 5: Talents can update candidates where they are the talent
CREATE POLICY "Talents can update their own candidates" ON candidates 
FOR UPDATE USING (talent_id = auth.uid());

-- Step 3: Verify the policies were created
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
WHERE tablename = 'candidates'
ORDER BY policyname;
