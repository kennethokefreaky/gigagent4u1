-- Enhanced Recent Places functionality
-- Run this in your Supabase SQL editor to add improvements

-- 1. Add cleanup function to remove old recent places (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_recent_places(
    p_days_to_keep integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    DELETE FROM public.recent_places
    WHERE last_interaction < (now() - interval '1 day' * p_days_to_keep);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.cleanup_old_recent_places TO authenticated;

-- 2. Add function to limit recent places per user (keep only most recent N places)
CREATE OR REPLACE FUNCTION public.limit_user_recent_places(
    p_user_id uuid,
    p_max_places integer DEFAULT 50
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    -- Delete older places beyond the limit
    WITH ranked_places AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY last_interaction DESC) as rn
        FROM public.recent_places
        WHERE user_id = p_user_id
    )
    DELETE FROM public.recent_places
    WHERE id IN (
        SELECT id FROM ranked_places WHERE rn > p_max_places
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.limit_user_recent_places TO authenticated;

-- 3. Enhanced function to add recent place with automatic cleanup
CREATE OR REPLACE FUNCTION public.add_recent_place_enhanced(
    p_user_id uuid,
    p_place_id text,
    p_place_name text,
    p_place_address text DEFAULT NULL,
    p_place_vicinity text DEFAULT NULL,
    p_latitude double precision DEFAULT NULL,
    p_longitude double precision DEFAULT NULL,
    p_place_type text DEFAULT 'searched'::text,
    p_max_places integer DEFAULT 50
)
RETURNS public.recent_places
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result public.recent_places;
BEGIN
    -- First, try to update existing record
    UPDATE public.recent_places
    SET 
        place_name = p_place_name,
        place_address = p_place_address,
        place_vicinity = p_place_vicinity,
        latitude = p_latitude,
        longitude = p_longitude,
        place_type = p_place_type,
        last_interaction = now(),
        updated_at = now()
    WHERE user_id = p_user_id AND place_id = p_place_id
    RETURNING * INTO v_result;
    
    -- If no existing record was updated, insert a new one
    IF NOT FOUND THEN
        INSERT INTO public.recent_places (
            user_id,
            place_id,
            place_name,
            place_address,
            place_vicinity,
            latitude,
            longitude,
            place_type,
            last_interaction,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            p_place_id,
            p_place_name,
            p_place_address,
            p_place_vicinity,
            p_latitude,
            p_longitude,
            p_place_type,
            now(),
            now(),
            now()
        )
        RETURNING * INTO v_result;
    END IF;
    
    -- Clean up old places for this user (keep only most recent N places)
    PERFORM public.limit_user_recent_places(p_user_id, p_max_places);
    
    RETURN v_result;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.add_recent_place_enhanced TO authenticated;

-- 4. Add function to get recent places with filtering options
CREATE OR REPLACE FUNCTION public.get_recent_places_filtered(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_place_type_filter text DEFAULT NULL,
    p_days_back integer DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    place_id text,
    place_name text,
    place_address text,
    place_vicinity text,
    latitude double precision,
    longitude double precision,
    place_type text,
    last_interaction timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.id,
        rp.place_id,
        rp.place_name,
        rp.place_address,
        rp.place_vicinity,
        rp.latitude,
        rp.longitude,
        rp.place_type,
        rp.last_interaction
    FROM public.recent_places rp
    WHERE rp.user_id = p_user_id
    AND (p_place_type_filter IS NULL OR rp.place_type = p_place_type_filter)
    AND (p_days_back IS NULL OR rp.last_interaction >= (now() - interval '1 day' * p_days_back))
    ORDER BY rp.last_interaction DESC
    LIMIT p_limit;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_recent_places_filtered TO authenticated;

-- 5. Add analytics function to get recent places statistics
CREATE OR REPLACE FUNCTION public.get_recent_places_stats(
    p_user_id uuid
)
RETURNS TABLE (
    total_places bigint,
    searched_count bigint,
    selected_count bigint,
    reviewed_count bigint,
    most_recent_interaction timestamp with time zone,
    oldest_interaction timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_places,
        COUNT(*) FILTER (WHERE place_type = 'searched') as searched_count,
        COUNT(*) FILTER (WHERE place_type = 'selected') as selected_count,
        COUNT(*) FILTER (WHERE place_type = 'reviewed') as reviewed_count,
        MAX(last_interaction) as most_recent_interaction,
        MIN(last_interaction) as oldest_interaction
    FROM public.recent_places
    WHERE user_id = p_user_id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_recent_places_stats TO authenticated;

-- 6. Create a scheduled cleanup job (optional - requires pg_cron extension)
-- This would run daily to clean up old recent places
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-recent-places', '0 2 * * *', 'SELECT public.cleanup_old_recent_places(90);');

-- Add comments
COMMENT ON FUNCTION public.cleanup_old_recent_places IS 'Removes recent places older than specified days';
COMMENT ON FUNCTION public.limit_user_recent_places IS 'Limits recent places per user to specified number';
COMMENT ON FUNCTION public.add_recent_place_enhanced IS 'Enhanced version that automatically cleans up old places';
COMMENT ON FUNCTION public.get_recent_places_filtered IS 'Get recent places with filtering options';
COMMENT ON FUNCTION public.get_recent_places_stats IS 'Get statistics about user recent places';
