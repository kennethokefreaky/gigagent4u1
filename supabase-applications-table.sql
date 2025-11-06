-- Create applications table for storing talent applications to events
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  talent_name TEXT NOT NULL,
  talent_categories TEXT[] DEFAULT '{}',
  talent_location TEXT,
  talent_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create policies for applications
-- Promoters can view applications for their events
CREATE POLICY "Promoters can view their applications" ON applications 
FOR SELECT USING (promoter_id = auth.uid());

-- Talents can view their own applications
CREATE POLICY "Talents can view their own applications" ON applications 
FOR SELECT USING (talent_id = auth.uid());

-- Talents can insert applications
CREATE POLICY "Talents can insert applications" ON applications 
FOR INSERT WITH CHECK (talent_id = auth.uid());

-- Promoters can update applications for their events
CREATE POLICY "Promoters can update their applications" ON applications 
FOR UPDATE USING (promoter_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_promoter_id ON applications(promoter_id);
CREATE INDEX IF NOT EXISTS idx_applications_talent_id ON applications(talent_id);
CREATE INDEX IF NOT EXISTS idx_applications_event_id ON applications(event_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_applications_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_applications_updated_at 
BEFORE UPDATE ON applications 
FOR EACH ROW 
EXECUTE FUNCTION update_applications_updated_at_column();
