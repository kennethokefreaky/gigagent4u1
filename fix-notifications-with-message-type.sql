-- FIX NOTIFICATIONS WITH MESSAGE TYPE COLUMN
-- This will add a message_type column to distinguish private vs group notifications
-- Run this in your Supabase SQL editor

-- 1. ADD MESSAGE_TYPE COLUMN TO NOTIFICATIONS TABLE
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'private';

-- 2. UPDATE EXISTING NOTIFICATIONS TO BE PRIVATE
UPDATE notifications SET message_type = 'private' WHERE message_type IS NULL;

-- 3. DROP THE OLD CONSTRAINT
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 4. CREATE A NEW CONSTRAINT THAT ALLOWS BOTH TYPES
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('new_message', 'group_message', 'message'));

-- 5. CREATE GROUP MESSAGE NOTIFICATION FUNCTION
CREATE OR REPLACE FUNCTION create_group_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    event_title TEXT;
    participant_record RECORD;
BEGIN
    -- Get sender name
    SELECT full_name INTO sender_name
    FROM profiles 
    WHERE id = NEW.sender_id;
    
    -- Get event title
    SELECT title INTO event_title
    FROM posts 
    WHERE id = NEW.event_id;
    
    -- Create notifications for all other participants
    FOR participant_record IN 
        SELECT user_id FROM message_participants 
        WHERE event_id = NEW.event_id 
        AND user_id != NEW.sender_id
    LOOP
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            button_text,
            icon,
            is_read,
            message_type,
            data
        ) VALUES (
            participant_record.user_id,
            'new_message',  -- Use same type as private messages
            'New Group Message',
            COALESCE(sender_name, 'Someone') || ' sent a message in ' || COALESCE(event_title, 'the event'),
            'View Message',
            '💬',
            false,
            'group',  -- This distinguishes it from private messages
            jsonb_build_object(
                'event_id', NEW.event_id,
                'sender_id', NEW.sender_id,
                'message_type', 'group'
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE THE TRIGGER
DROP TRIGGER IF EXISTS create_group_message_notification ON messages;
CREATE TRIGGER create_group_message_notification
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION create_group_message_notification();

-- 7. VERIFY THE CHANGES
SELECT 'NOTIFICATIONS FIXED - BOTH PRIVATE AND GROUP MESSAGES SUPPORTED' as status;

-- 8. SHOW THE NEW STRUCTURE
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;
