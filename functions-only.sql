-- Functions Only - Copy and paste this into Supabase SQL Editor
-- (Table already exists, so we just need the functions)

-- Create function to add or update recent place
CREATE OR REPLACE FUNCTION public.add_recent_place(
    p_user_id uuid,
    p_place_id text,
    p_place_name text,
    p_place_address text DEFAULT NULL,
    p_place_vicinity text DEFAULT NULL,
    p_latitude double precision DEFAULT NULL,
    p_longitude double precision DEFAULT NULL,
    p_place_type text DEFAULT 'searched'::text
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
    
    RETURN v_result;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.add_recent_place TO authenticated;

-- Create function to get recent places for a user
CREATE OR REPLACE FUNCTION public.get_recent_places(
    p_user_id uuid,
    p_limit integer DEFAULT 20
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
    ORDER BY rp.last_interaction DESC
    LIMIT p_limit;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_recent_places TO authenticated;
