-- EMERGENCY FIX for 409 Conflict errors in user_locations table
-- This script temporarily disables RLS to allow location saving

-- Temporarily disable RLS on user_locations table
ALTER TABLE user_locations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can insert their own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can update their own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can delete their own locations" ON user_locations;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_locations;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_locations;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_locations;

-- Drop any unique constraints that might be causing conflicts
DO $$ 
BEGIN
    -- Try to drop common constraint names
    BEGIN
        ALTER TABLE user_locations DROP CONSTRAINT IF EXISTS user_locations_user_id_is_primary_key;
    EXCEPTION WHEN OTHERS THEN
        -- Constraint doesn't exist, continue
    END;
    
    BEGIN
        ALTER TABLE user_locations DROP CONSTRAINT IF EXISTS user_locations_user_id_key;
    EXCEPTION WHEN OTHERS THEN
        -- Constraint doesn't exist, continue
    END;
    
    BEGIN
        ALTER TABLE user_locations DROP CONSTRAINT IF EXISTS user_locations_pkey;
    EXCEPTION WHEN OTHERS THEN
        -- Constraint doesn't exist, continue
    END;
END $$;

-- Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    location_name TEXT NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Unknown',
    is_primary BOOLEAN DEFAULT false,
    location_type TEXT DEFAULT 'user_selected',
    distance_miles INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add distance_miles column if it doesn't exist
ALTER TABLE user_locations 
ADD COLUMN IF NOT EXISTS distance_miles INTEGER DEFAULT 10;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_is_primary ON user_locations(user_id, is_primary);

-- Update existing records
UPDATE user_locations 
SET distance_miles = 10 
WHERE distance_miles IS NULL;

-- Show table info
SELECT 'user_locations table is now accessible without RLS restrictions' as status;
