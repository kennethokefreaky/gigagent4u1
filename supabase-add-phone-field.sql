-- Add phone number field to profiles table
-- Run this in your Supabase SQL editor

-- Add phone_number column to profiles table
ALTER TABLE profiles 
ADD COLUMN phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.phone_number IS 'Promoter phone number for contact purposes';

-- Create index for phone number searches (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- Update RLS policy to allow users to update their own phone number
-- (This assumes you already have RLS enabled on profiles table)
-- Users can view and update their own phone number
-- Other users can view phone numbers for contact purposes



