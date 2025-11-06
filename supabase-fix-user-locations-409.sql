-- Fix 409 Conflict errors in user_locations table
-- This script addresses unique constraint and RLS policy issues

-- First, let's check the current table structure and constraints
-- (This is for reference - you can run this in Supabase SQL editor to see current state)
/*
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_locations'
ORDER BY tc.constraint_type, tc.constraint_name;
*/

-- Drop any existing unique constraints that might be causing conflicts
-- (Only if they exist - this won't error if they don't exist)
DO $$ 
BEGIN
    -- Drop unique constraint on user_id + is_primary if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_locations_user_id_is_primary_key' 
        AND table_name = 'user_locations'
    ) THEN
        ALTER TABLE user_locations DROP CONSTRAINT user_locations_user_id_is_primary_key;
        RAISE NOTICE 'Dropped unique constraint: user_locations_user_id_is_primary_key';
    END IF;

    -- Drop any other unique constraints that might exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_locations_user_id_key' 
        AND table_name = 'user_locations'
    ) THEN
        ALTER TABLE user_locations DROP CONSTRAINT user_locations_user_id_key;
        RAISE NOTICE 'Dropped unique constraint: user_locations_user_id_key';
    END IF;
END $$;

-- Ensure the table has the correct structure
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Unknown',
    is_primary BOOLEAN DEFAULT false,
    location_type TEXT DEFAULT 'user_selected',
    distance_miles INTEGER DEFAULT 10 CHECK (distance_miles >= 0 AND distance_miles <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add distance_miles column if it doesn't exist
ALTER TABLE user_locations 
ADD COLUMN IF NOT EXISTS distance_miles INTEGER DEFAULT 10 CHECK (distance_miles >= 0 AND distance_miles <= 100);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_is_primary ON user_locations(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_user_locations_distance ON user_locations(distance_miles);

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can insert their own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can update their own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can delete their own locations" ON user_locations;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_locations;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_locations;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_locations;

-- Create clean, simple RLS policies
CREATE POLICY "Users can view their own locations" ON user_locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations" ON user_locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" ON user_locations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" ON user_locations
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_locations_updated_at ON user_locations;
CREATE TRIGGER update_user_locations_updated_at
    BEFORE UPDATE ON user_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have default distance if null
UPDATE user_locations 
SET distance_miles = 10 
WHERE distance_miles IS NULL;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_locations' 
ORDER BY ordinal_position;

-- Show current policies
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
WHERE tablename = 'user_locations'
ORDER BY policyname;
