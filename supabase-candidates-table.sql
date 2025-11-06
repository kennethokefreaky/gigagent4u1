-- Create candidates table for storing accepted offers
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  offer_amount TEXT NOT NULL,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('accepted', 'pending', 'declined')),
  talent_name TEXT NOT NULL,
  talent_categories TEXT[] DEFAULT '{}',
  talent_location TEXT,
  talent_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create policies for candidates
-- Promoters can view their own candidates
CREATE POLICY "Promoters can view their own candidates" ON candidates 
FOR SELECT USING (promoter_id = auth.uid());

-- Talents can view candidates where they are the talent
CREATE POLICY "Talents can view their own candidates" ON candidates 
FOR SELECT USING (talent_id = auth.uid());

-- Promoters can insert candidates (when talent accepts offer)
CREATE POLICY "Promoters can insert candidates" ON candidates 
FOR INSERT WITH CHECK (promoter_id = auth.uid());

-- Promoters can update their own candidates
CREATE POLICY "Promoters can update their own candidates" ON candidates 
FOR UPDATE USING (promoter_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_promoter_id ON candidates(promoter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_talent_id ON candidates(talent_id);
CREATE INDEX IF NOT EXISTS idx_candidates_event_id ON candidates(event_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_candidates_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_candidates_updated_at 
BEFORE UPDATE ON candidates 
FOR EACH ROW 
EXECUTE FUNCTION update_candidates_updated_at_column();
