-- Fix review count and star rating calculation
-- This will ensure the place_ratings table is properly updated

-- First, let's check if the triggers are working
-- If not, we'll manually update the ratings

-- Update all existing place_ratings with correct counts
UPDATE place_ratings 
SET 
    total_ratings = (
        SELECT COUNT(*) 
        FROM place_feedback 
        WHERE place_feedback.place_id = place_ratings.place_id 
        AND place_feedback.is_public = true
    ),
    average_rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM place_feedback 
        WHERE place_feedback.place_id = place_ratings.place_id 
        AND place_feedback.is_public = true
    ),
    total_comments = (
        SELECT COUNT(*) 
        FROM place_feedback 
        WHERE place_feedback.place_id = place_ratings.place_id 
        AND place_feedback.is_public = true
        AND comment IS NOT NULL 
        AND comment != ''
    ),
    last_updated = NOW()
WHERE place_id IN (
    SELECT DISTINCT place_id 
    FROM place_feedback 
    WHERE is_public = true
);

-- Insert missing place_ratings for places that have feedback but no rating record
INSERT INTO place_ratings (
    place_id,
    place_name,
    place_address,
    place_latitude,
    place_longitude,
    total_ratings,
    average_rating,
    total_comments,
    last_updated,
    created_at
)
SELECT 
    pf.place_id,
    pf.place_name,
    pf.place_address,
    pf.place_latitude,
    pf.place_longitude,
    COUNT(*) as total_ratings,
    COALESCE(AVG(pf.rating), 0) as average_rating,
    COUNT(CASE WHEN pf.comment IS NOT NULL AND pf.comment != '' THEN 1 END) as total_comments,
    NOW() as last_updated,
    NOW() as created_at
FROM place_feedback pf
WHERE pf.is_public = true
AND NOT EXISTS (
    SELECT 1 FROM place_ratings pr 
    WHERE pr.place_id = pf.place_id
)
GROUP BY pf.place_id, pf.place_name, pf.place_address, pf.place_latitude, pf.place_longitude;

-- Test the results
SELECT 
    place_name,
    total_ratings,
    average_rating,
    total_comments
FROM place_ratings 
ORDER BY last_updated DESC 
LIMIT 10;

-- Show success message
SELECT 'Review count and star ratings updated successfully!' as status;

