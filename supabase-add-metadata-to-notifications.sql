-- Add metadata column to notifications table for event-specific offer tracking
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata TEXT;

-- Create index for better performance on metadata queries
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON public.notifications(metadata);

-- Add comment to explain the metadata column usage
COMMENT ON COLUMN public.notifications.metadata IS 'JSON string containing event-specific data for offers (eventId, eventTitle, promoterId)';
