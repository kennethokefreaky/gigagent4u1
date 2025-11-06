-- Create trash table for removed posts and their associated data
CREATE TABLE IF NOT EXISTS trash (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_post_id UUID NOT NULL,
  post_data JSONB NOT NULL, -- Store the complete post data
  group_messages JSONB, -- Store all group messages for this event
  participants JSONB, -- Store participant data
  removed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  removed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT DEFAULT 'Event ended by promoter'
);

-- Enable Row Level Security
ALTER TABLE trash ENABLE ROW LEVEL SECURITY;

-- Create policies for trash table (drop existing first)
-- Promoters can view their own removed posts
DROP POLICY IF EXISTS "Promoters can view their own trash" ON trash;
CREATE POLICY "Promoters can view their own trash" ON trash 
FOR SELECT USING (removed_by = auth.uid());

-- Promoters can insert their own trash
DROP POLICY IF EXISTS "Promoters can insert trash" ON trash;
CREATE POLICY "Promoters can insert trash" ON trash 
FOR INSERT WITH CHECK (removed_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trash_removed_by ON trash(removed_by);
CREATE INDEX IF NOT EXISTS idx_trash_removed_at ON trash(removed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_original_post_id ON trash(original_post_id);

-- Create function to move post to trash (replace if exists)
DROP FUNCTION IF EXISTS move_post_to_trash(UUID, UUID);
CREATE FUNCTION move_post_to_trash(
  post_id_param UUID,
  removed_by_param UUID
) RETURNS BOOLEAN AS $$
DECLARE
  post_record RECORD;
  messages_data JSONB;
  participants_data JSONB;
BEGIN
  -- Get the post data
  SELECT * INTO post_record FROM posts WHERE id = post_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get all group messages for this event
  SELECT COALESCE(json_agg(messages.*), '[]'::json) INTO messages_data
  FROM messages 
  WHERE event_id = post_id_param;
  
  -- Get all participants for this event
  SELECT COALESCE(json_agg(participants.*), '[]'::json) INTO participants_data
  FROM message_participants 
  WHERE event_id = post_id_param;
  
  -- Insert into trash table
  INSERT INTO trash (
    original_post_id,
    post_data,
    group_messages,
    participants,
    removed_by,
    reason
  ) VALUES (
    post_id_param,
    to_jsonb(post_record),
    messages_data,
    participants_data,
    removed_by_param,
    'Event ended by promoter'
  );
  
  -- Delete the original post
  DELETE FROM posts WHERE id = post_id_param;
  
  -- Clean up related data
  DELETE FROM message_participants WHERE event_id = post_id_param;
  DELETE FROM unified_participants WHERE conversation_id = 'group_' || post_id_param;
  DELETE FROM messages WHERE event_id = post_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
