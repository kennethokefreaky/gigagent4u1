-- DEBUG KEITH CAROLS PROFILE SEARCH
-- This will help us find Keith Carols' exact profile
-- Run this in your Supabase SQL editor

-- 1. SEARCH FOR ALL PROFILES WITH "keith" (case insensitive)
SELECT 'ALL PROFILES WITH KEITH' as section;
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE LOWER(email) LIKE '%keith%' 
   OR LOWER(full_name) LIKE '%keith%'
ORDER BY created_at DESC;

-- 2. SEARCH FOR ALL PROFILES WITH "carol" (case insensitive)
SELECT 'ALL PROFILES WITH CAROL' as section;
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE LOWER(email) LIKE '%carol%' 
   OR LOWER(full_name) LIKE '%carol%'
ORDER BY created_at DESC;

-- 3. SEARCH FOR ALL PROMOTERS
SELECT 'ALL PROMOTERS' as section;
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE role = 'promoter'
ORDER BY created_at DESC;

-- 4. CHECK ALL UNIFIED PARTICIPANTS
SELECT 'ALL UNIFIED PARTICIPANTS' as section;
SELECT 
    up.conversation_id,
    up.conversation_type,
    up.user_id,
    up.last_read_at,
    p.full_name,
    p.email,
    p.role
FROM unified_participants up
LEFT JOIN profiles p ON up.user_id = p.id
WHERE p.role = 'promoter'
ORDER BY p.full_name;
