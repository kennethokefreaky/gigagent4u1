-- Add email field to profiles table
-- Run this in your Supabase SQL editor

-- Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.email IS 'User email address from auth.users for display purposes';

-- Create index for email searches (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update existing profiles with email from auth.users
-- This is a one-time migration to populate existing profiles
UPDATE profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;

-- Update RLS policy to allow users to view email addresses
-- (This assumes you already have RLS enabled on profiles table)
-- Users can view email addresses for contact purposes
