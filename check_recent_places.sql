-- Check if recent_places table exists and what's in it
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recent_places' 
ORDER BY ordinal_position;

-- Check if functions exist
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%recent%' 
AND routine_schema = 'public';

-- Check RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'recent_places';
