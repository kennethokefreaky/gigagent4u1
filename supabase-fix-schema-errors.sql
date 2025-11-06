-- Fix schema errors and missing foreign key relationships
-- Run this in your Supabase SQL editor

-- First, let's check if the posts table has the correct foreign key
-- If not, we'll add it

-- Add foreign key constraint for posts.promoter_id -> profiles.id if it doesn't exist
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_promoter_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE posts 
        ADD CONSTRAINT posts_promoter_id_fkey 
        FOREIGN KEY (promoter_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint posts_promoter_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint posts_promoter_id_fkey already exists';
    END IF;
END $$;

-- Ensure the messages table has the correct foreign key relationships
-- Check if messages.event_id -> posts.id foreign key exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_event_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES posts(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint messages_event_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint messages_event_id_fkey already exists';
    END IF;
END $$;

-- Check if messages.sender_id -> profiles.id foreign key exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_sender_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint messages_sender_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint messages_sender_id_fkey already exists';
    END IF;
END $$;

-- Refresh the schema cache to ensure PostgREST recognizes the new relationships
NOTIFY pgrst, 'reload schema';

-- Add comments for documentation
COMMENT ON CONSTRAINT posts_promoter_id_fkey ON posts IS 'Foreign key linking posts to their promoter in profiles table';
COMMENT ON CONSTRAINT messages_event_id_fkey ON messages IS 'Foreign key linking messages to their event in posts table';
COMMENT ON CONSTRAINT messages_sender_id_fkey ON messages IS 'Foreign key linking messages to their sender in profiles table';
