-- COMPREHENSIVE REGISTRATION DEBUG SCRIPT
-- Run this in your Supabase SQL Editor to identify the registration issue

-- 1. Check if there are any triggers on auth.users table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 2. Check for any functions that might be called by triggers
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%' OR routine_name LIKE '%profile%' OR routine_name LIKE '%auth%';

-- 3. Check the profiles table structure and constraints
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 4. Check for any constraints that might be failing
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- 5. Check RLS policies on profiles table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Check if there are any foreign key constraints that might be failing
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='profiles';

-- 7. Test if we can manually insert a profile (this will be rolled back)
BEGIN;
  -- Try to insert a test profile
  INSERT INTO profiles (id, email, verification_status) 
  VALUES (gen_random_uuid(), 'test@example.com', 'unverified');
  
  -- If this fails, we'll see the exact error
  ROLLBACK;

-- 8. Check if there are any custom functions that might be interfering
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%user%' 
OR proname LIKE '%profile%' 
OR proname LIKE '%auth%'
OR proname LIKE '%signup%';

-- 9. Check for any database-level policies or restrictions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND (tablename LIKE '%user%' OR tablename LIKE '%profile%' OR tablename LIKE '%auth%');

-- 10. Check if there are any row-level security issues
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND (tablename LIKE '%user%' OR tablename LIKE '%profile%' OR tablename LIKE '%auth%');

-- 11. Check for any custom types that might be causing issues
SELECT 
    typname,
    typtype,
    typcategory
FROM pg_type 
WHERE typname LIKE '%user%' 
OR typname LIKE '%profile%' 
OR typname LIKE '%auth%';

-- 12. Check if there are any sequences that might be out of sync
SELECT 
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment,
    cycle_option
FROM information_schema.sequences 
WHERE sequence_schema = 'public';

-- 13. Check for any custom domains that might be causing validation issues
SELECT 
    domain_name,
    data_type,
    character_maximum_length,
    is_nullable,
    domain_default
FROM information_schema.domains 
WHERE domain_schema = 'public';

-- 14. Check if there are any custom operators that might be interfering
SELECT 
    oprname,
    oprleft::regtype,
    oprright::regtype,
    oprresult::regtype
FROM pg_operator 
WHERE oprname LIKE '%user%' 
OR oprname LIKE '%profile%' 
OR oprname LIKE '%auth%';

-- 15. Final check - try to create a minimal profile table structure
-- This will show us if there are any fundamental issues
SELECT 'Checking if profiles table can be accessed...' as status;

-- Try a simple select to see if table is accessible
SELECT COUNT(*) as profile_count FROM profiles;

-- If all the above queries run without errors, the issue might be:
-- 1. A trigger that's failing
-- 2. A custom function that's being called
-- 3. A constraint that's not visible in the schema
-- 4. A Supabase-specific configuration issue

SELECT 'Audit complete. Check the results above for any errors or unexpected configurations.' as final_status;
