-- Add distance_miles column to existing user_locations table
ALTER TABLE user_locations 
ADD COLUMN IF NOT EXISTS distance_miles INTEGER DEFAULT 10 CHECK (distance_miles >= 0 AND distance_miles <= 100);

-- Create index for better performance on distance filtering
CREATE INDEX IF NOT EXISTS idx_user_locations_distance ON user_locations(distance_miles);

-- Update existing records to have default distance of 10 miles
UPDATE user_locations 
SET distance_miles = 10 
WHERE distance_miles IS NULL;
