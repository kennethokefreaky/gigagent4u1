-- Fix the chat usage trigger function to use event_id instead of post_id
-- Run this in your Supabase SQL editor

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_chat_usage_trigger ON messages;

-- Update the function to use event_id instead of post_id
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

-- Recreate the trigger
CREATE TRIGGER update_chat_usage_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_usage_count();

-- Reload the schema to ensure changes take effect
NOTIFY pgrst, 'reload schema';
