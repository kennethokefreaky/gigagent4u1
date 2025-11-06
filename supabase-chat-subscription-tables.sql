-- Chat subscription and usage tracking tables
-- Run this in your Supabase SQL editor

-- Create chat_subscriptions table to track talent subscription status
CREATE TABLE IF NOT EXISTS chat_subscriptions (
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

-- Create chat_usage table to track individual chat messages sent to promoters
CREATE TABLE IF NOT EXISTS chat_usage (
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
CREATE INDEX IF NOT EXISTS idx_chat_subscriptions_user_id ON chat_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_subscriptions_status ON chat_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_chat_usage_talent_id ON chat_usage(talent_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_promoter_id ON chat_usage(promoter_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_event_id ON chat_usage(event_id);

-- Enable RLS on both tables
ALTER TABLE chat_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_subscriptions
CREATE POLICY "Users can view their own chat subscription" ON chat_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat subscription" ON chat_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat subscription" ON chat_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat_usage
CREATE POLICY "Users can view chat usage where they are talent or promoter" ON chat_usage
  FOR SELECT USING (auth.uid() = talent_id OR auth.uid() = promoter_id);

CREATE POLICY "Users can insert chat usage where they are talent" ON chat_usage
  FOR INSERT WITH CHECK (auth.uid() = talent_id);

CREATE POLICY "Users can update chat usage where they are talent" ON chat_usage
  FOR UPDATE USING (auth.uid() = talent_id);

-- Function to automatically create chat subscription for new users
CREATE OR REPLACE FUNCTION create_chat_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_subscriptions (user_id, subscription_type, subscription_status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create chat subscription when new user is created
CREATE TRIGGER create_chat_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_subscription_for_new_user();

-- Function to update chat usage count
CREATE OR REPLACE FUNCTION update_chat_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the message count in chat_usage
  UPDATE chat_usage 
  SET message_count = message_count + 1,
      updated_at = NOW()
  WHERE talent_id = NEW.sender_id 
    AND promoter_id = (
      SELECT promoter_id FROM posts WHERE id = NEW.event_id
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update chat usage when new message is sent
-- Note: This assumes messages table has sender_id and event_id columns
-- The event_id references the posts table (events)
CREATE TRIGGER update_chat_usage_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_usage_count();

-- Add comments for documentation
COMMENT ON TABLE chat_subscriptions IS 'Tracks talent chat subscription status and free chat usage';
COMMENT ON TABLE chat_usage IS 'Tracks individual chat conversations between talent and promoters';
COMMENT ON COLUMN chat_subscriptions.free_chats_used IS 'Number of free chats used this month';
COMMENT ON COLUMN chat_subscriptions.free_chats_limit IS 'Maximum number of free chats allowed (default 15)';
COMMENT ON COLUMN chat_usage.first_message_sent_at IS 'When the first message was sent to this promoter';
COMMENT ON COLUMN chat_usage.message_count IS 'Total number of messages sent to this promoter';
