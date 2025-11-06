-- Recently Searched Setup SQL
-- Copy and paste this entire file into your Supabase SQL Editor

-- Create table for storing recently searched/selected places
CREATE TABLE IF NOT EXISTS public.recent_places (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    place_id text NOT NULL,
    place_name text NOT NULL,
    place_address text,
    place_vicinity text,
    latitude double precision,
    longitude double precision,
    place_type text DEFAULT 'searched'::text NOT NULL,
    last_interaction timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT recent_places_pkey PRIMARY KEY (id)
);

-- Add foreign key constraint
ALTER TABLE public.recent_places 
ADD CONSTRAINT recent_places_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recent_places_user_id ON public.recent_places(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_places_last_interaction ON public.recent_places(last_interaction DESC);
CREATE INDEX IF NOT EXISTS idx_recent_places_place_type ON public.recent_places(place_type);
CREATE INDEX IF NOT EXISTS idx_recent_places_user_place ON public.recent_places(user_id, place_id);

-- Enable Row Level Security
ALTER TABLE public.recent_places ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own recent places"
ON public.recent_places FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recent places"
ON public.recent_places FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recent places"
ON public.recent_places FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recent places"
ON public.recent_places FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

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

-- Add comment to explain the table
COMMENT ON TABLE public.recent_places IS 'Stores recently searched, selected, or reviewed places for each user';
COMMENT ON COLUMN public.recent_places.place_type IS 'Type of interaction: searched, selected, reviewed';
COMMENT ON COLUMN public.recent_places.last_interaction IS 'When the user last interacted with this place';
