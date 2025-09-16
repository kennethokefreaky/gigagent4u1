-- Create messages table for group conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message participants table to track who's in each conversation
CREATE TABLE IF NOT EXISTS message_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create message read status table for tracking unread messages
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_participants_event_id ON message_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON message_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
-- Users can view messages for events they're participants in
CREATE POLICY "Users can view messages for events they participate in" ON messages
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages for events they're participants in
CREATE POLICY "Users can send messages for events they participate in" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for message_participants
-- Users can view participants for events they're part of
CREATE POLICY "Users can view participants for their events" ON message_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can join conversations for events they have access to
CREATE POLICY "Users can join event conversations" ON message_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own participation status
CREATE POLICY "Users can update their own participation" ON message_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for message_read_status
-- Users can view read status for messages they have access to
CREATE POLICY "Users can view read status for their messages" ON message_read_status
  FOR SELECT USING (
    user_id = auth.uid() OR
    message_id IN (
      SELECT m.id FROM messages m
      JOIN message_participants mp ON m.event_id = mp.event_id
      WHERE mp.user_id = auth.uid()
    )
  );

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own read status
CREATE POLICY "Users can update their own read status" ON message_read_status
  FOR UPDATE USING (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_messages_updated_at_column();

-- Create function to automatically add promoter as participant when event is created
CREATE OR REPLACE FUNCTION add_promoter_to_event_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the promoter (event creator) to the conversation
  INSERT INTO message_participants (event_id, user_id)
  VALUES (NEW.id, NEW.promoter_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically add promoter to conversation
CREATE TRIGGER add_promoter_to_conversation
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION add_promoter_to_event_conversation();


