-- Chat Flow Fix - Copy and paste this into Supabase SQL Editor
-- This ensures the chat subscription flow works correctly

-- Ensure notifications table has data column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS data JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN public.notifications.data IS 'JSON data containing event-specific information (event_id, talent_id, application_id, etc.)';

-- Create index for better performance on data queries
CREATE INDEX IF NOT EXISTS idx_notifications_data ON public.notifications USING GIN (data);

-- Update the notification type check to include 'application_received'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'first_event', 
  'new_message', 
  'location_based', 
  'event_posted', 
  'talent_accepted', 
  'verification_required', 
  'offer_received', 
  'offer_accepted', 
  'offer_edited', 
  'breakfast_reminder', 
  'lunch_reminder', 
  'dinner_reminder',
  'application_received'
));

-- Create chat_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  free_chats_used INTEGER NOT NULL DEFAULT 0,
  free_chats_limit INTEGER NOT NULL DEFAULT 15,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  first_message_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(talent_id, promoter_id) -- Ensure only one record per talent-promoter pair
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_subscriptions_user_id ON public.chat_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_subscriptions_status ON public.chat_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_chat_usage_talent_id ON public.chat_usage(talent_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_promoter_id ON public.chat_usage(promoter_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_event_id ON public.chat_usage(event_id);

-- Enable RLS on both tables
ALTER TABLE public.chat_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_subscriptions
DROP POLICY IF EXISTS "Users can view their own chat subscription" ON public.chat_subscriptions;
CREATE POLICY "Users can view their own chat subscription"
ON public.chat_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat subscription" ON public.chat_subscriptions;
CREATE POLICY "Users can insert their own chat subscription"
ON public.chat_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chat subscription" ON public.chat_subscriptions;
CREATE POLICY "Users can update their own chat subscription"
ON public.chat_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for chat_usage
DROP POLICY IF EXISTS "Users can view their own chat usage" ON public.chat_usage;
CREATE POLICY "Users can view their own chat usage"
ON public.chat_usage FOR SELECT
TO authenticated
USING (auth.uid() = talent_id OR auth.uid() = promoter_id);

DROP POLICY IF EXISTS "Users can insert chat usage" ON public.chat_usage;
CREATE POLICY "Users can insert chat usage"
ON public.chat_usage FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = talent_id);

DROP POLICY IF EXISTS "Users can update chat usage" ON public.chat_usage;
CREATE POLICY "Users can update chat usage"
ON public.chat_usage FOR UPDATE
TO authenticated
USING (auth.uid() = talent_id OR auth.uid() = promoter_id)
WITH CHECK (auth.uid() = talent_id OR auth.uid() = promoter_id);

-- Add comments
COMMENT ON TABLE public.chat_subscriptions IS 'Tracks user chat subscription status and limits';
COMMENT ON TABLE public.chat_usage IS 'Tracks individual chat conversations between talent and promoters';
COMMENT ON TABLE public.notifications IS 'User notifications with JSON data support for event-specific information';
