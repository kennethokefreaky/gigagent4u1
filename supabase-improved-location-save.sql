-- Improved location saving approach
-- This script creates a function that handles location saving more robustly

-- Create or replace function to save user location
CREATE OR REPLACE FUNCTION save_user_location(
    p_user_id UUID,
    p_location_name TEXT,
    p_address TEXT DEFAULT NULL,
    p_latitude DECIMAL(10, 8),
    p_longitude DECIMAL(11, 8),
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_country TEXT DEFAULT 'Unknown',
    p_location_type TEXT DEFAULT 'user_selected'
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    location_name TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city TEXT,
    state TEXT,
    country TEXT,
    is_primary BOOLEAN,
    location_type TEXT,
    distance_miles INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, set all existing locations for this user as non-primary
    UPDATE user_locations 
    SET is_primary = false, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Insert the new primary location
    INSERT INTO user_locations (
        user_id,
        location_name,
        address,
        latitude,
        longitude,
        city,
        state,
        country,
        is_primary,
        location_type,
        distance_miles,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_location_name,
        p_address,
        p_latitude,
        p_longitude,
        p_city,
        p_state,
        p_country,
        true,
        p_location_type,
        10, -- Default distance
        NOW(),
        NOW()
    )
    RETURNING 
        user_locations.id,
        user_locations.user_id,
        user_locations.location_name,
        user_locations.address,
        user_locations.latitude,
        user_locations.longitude,
        user_locations.city,
        user_locations.state,
        user_locations.country,
        user_locations.is_primary,
        user_locations.location_type,
        user_locations.distance_miles,
        user_locations.created_at,
        user_locations.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_user_location TO authenticated;

-- Test the function (optional - you can run this to test)
-- SELECT * FROM save_user_location(
--     'your-user-id-here'::UUID,
--     'Test Location',
--     'Test Address',
--     40.7128,
--     -74.0060,
--     'New York',
--     'NY',
--     'US',
--     'user_selected'
-- );
