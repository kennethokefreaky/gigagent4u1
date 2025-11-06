-- Fix notifications table to add metadata column for event-specific offer tracking
-- This addresses the "column notifications.metadata does not exist" error

-- First, check if the column exists and add it if it doesn't
DO $$ 
BEGIN
    -- Check if metadata column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'metadata'
    ) THEN
        -- Add the metadata column
        ALTER TABLE public.notifications 
        ADD COLUMN metadata TEXT;
        
        -- Add comment to explain the column
        COMMENT ON COLUMN public.notifications.metadata IS 'JSON string containing event-specific data for offers (eventId, eventTitle, promoterId)';
        
        RAISE NOTICE 'Added metadata column to notifications table';
    ELSE
        RAISE NOTICE 'Metadata column already exists in notifications table';
    END IF;
END $$;

-- Create index for better performance on metadata queries
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON public.notifications(metadata);

-- Create index for better performance on offer-related queries
CREATE INDEX IF NOT EXISTS idx_notifications_type_user_read ON public.notifications(type, user_id, is_read);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications' 
AND column_name = 'metadata';
