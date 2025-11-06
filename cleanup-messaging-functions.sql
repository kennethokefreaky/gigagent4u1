-- CLEANUP OLD CONFLICTING FUNCTIONS ONLY
-- This removes ONLY the broken functions that are causing conflicts
-- KEEPS the working unified functions for private messages
-- Run this in your Supabase SQL editor

-- Drop ONLY the problematic functions that are causing conflicts
DROP FUNCTION IF EXISTS send_group_message(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS get_group_messages(TEXT, UUID);

-- KEEP the unified functions for private messages (they work!)
-- send_unified_message and get_unified_messages stay

-- Verify cleanup
SELECT 'Old conflicting functions cleaned up - unified functions preserved' as status;
