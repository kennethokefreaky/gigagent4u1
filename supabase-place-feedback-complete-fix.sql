-- Complete fix for place feedback system
-- This addresses 406 errors, multiple comments, and rating aggregation

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Users can insert their own place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Users can update their own place feedback" ON place_feedback;
DROP POLICY IF EXISTS "Users can delete their own place feedback" ON place_feedback;

DROP POLICY IF EXISTS "Users can view all place ratings" ON place_ratings;
DROP POLICY IF EXISTS "Users can insert place ratings" ON place_ratings;
DROP POLICY IF EXISTS "Users can update place ratings" ON place_ratings;

-- Create new RLS policies for place_feedback
CREATE POLICY "Users can view all place feedback" ON place_feedback
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own place feedback" ON place_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own place feedback" ON place_feedback
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own place feedback" ON place_feedback
    FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for place_ratings
CREATE POLICY "Users can view all place ratings" ON place_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert place ratings" ON place_ratings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update place ratings" ON place_ratings
    FOR UPDATE USING (true);

-- Create function to update place ratings when feedback is added/updated/deleted
CREATE OR REPLACE FUNCTION update_place_ratings()
RETURNS TRIGGER AS $$
DECLARE
    place_id_val TEXT;
    place_name_val TEXT;
    place_address_val TEXT;
    place_lat_val DECIMAL;
    place_lng_val DECIMAL;
BEGIN
    -- Determine place_id based on operation
    IF TG_OP = 'DELETE' THEN
        place_id_val := OLD.place_id;
        place_name_val := OLD.place_name;
        place_address_val := OLD.place_address;
        place_lat_val := OLD.place_latitude;
        place_lng_val := OLD.place_longitude;
    ELSE
        place_id_val := NEW.place_id;
        place_name_val := NEW.place_name;
        place_address_val := NEW.place_address;
        place_lat_val := NEW.place_latitude;
        place_lng_val := NEW.place_longitude;
    END IF;

    -- Insert or update place_ratings
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
        place_id_val,
        place_name_val,
        place_address_val,
        place_lat_val,
        place_lng_val,
        COUNT(*) as total_ratings,
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(CASE WHEN comment IS NOT NULL AND comment != '' THEN 1 END) as total_comments,
        NOW() as last_updated,
        NOW() as created_at
    FROM place_feedback 
    WHERE place_id = place_id_val AND is_public = true
    ON CONFLICT (place_id) 
    DO UPDATE SET
        total_ratings = EXCLUDED.total_ratings,
        average_rating = EXCLUDED.average_rating,
        total_comments = EXCLUDED.total_comments,
        last_updated = EXCLUDED.last_updated;

    -- If no feedback exists, delete the rating record
    IF NOT EXISTS (SELECT 1 FROM place_feedback WHERE place_id = place_id_val AND is_public = true) THEN
        DELETE FROM place_ratings WHERE place_id = place_id_val;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_place_ratings_insert ON place_feedback;
DROP TRIGGER IF EXISTS trigger_update_place_ratings_update ON place_feedback;
DROP TRIGGER IF EXISTS trigger_update_place_ratings_delete ON place_feedback;

-- Create triggers for place_feedback
CREATE TRIGGER trigger_update_place_ratings_insert
    AFTER INSERT ON place_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_place_ratings();

CREATE TRIGGER trigger_update_place_ratings_update
    AFTER UPDATE ON place_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_place_ratings();

CREATE TRIGGER trigger_update_place_ratings_delete
    AFTER DELETE ON place_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_place_ratings();

-- Test the setup
SELECT 'Place feedback system setup complete!' as status;

