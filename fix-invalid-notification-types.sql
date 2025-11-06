-- FIX INVALID NOTIFICATION TYPES
-- This will identify and fix the invalid notification types
-- Run this in your Supabase SQL editor

-- 1. SEE WHAT INVALID TYPES EXIST
SELECT 'INVALID NOTIFICATION TYPES' as section;

SELECT type, COUNT(*) as count
FROM notifications 
WHERE type NOT IN ('new_message', 'group_message', 'message', 'notification')
GROUP BY type
ORDER BY count DESC;

-- 2. SEE ALL UNIQUE TYPES
SELECT 'ALL NOTIFICATION TYPES' as section;

SELECT type, COUNT(*) as count
FROM notifications 
GROUP BY type
ORDER BY count DESC;

-- 3. UPDATE INVALID TYPES TO VALID ONES
UPDATE notifications 
SET type = 'new_message' 
WHERE type NOT IN ('new_message', 'group_message', 'message', 'notification');

-- 4. VERIFY THE FIX
SELECT 'AFTER FIXING INVALID TYPES' as section;

SELECT 
    'Total notifications' as status,
    COUNT(*) as total_count
FROM notifications;

SELECT 
    'Invalid types remaining' as status,
    COUNT(*) as invalid_count
FROM notifications 
WHERE type NOT IN ('new_message', 'group_message', 'message', 'notification');

-- 5. NOW WE CAN SAFELY UPDATE THE CONSTRAINT
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('new_message', 'group_message', 'message', 'notification'));

-- 6. ADD MESSAGE_TYPE COLUMN
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'private';

-- 7. UPDATE EXISTING NOTIFICATIONS
UPDATE notifications SET message_type = 'private' WHERE message_type IS NULL;

-- 8. CREATE GROUP MESSAGE NOTIFICATION FUNCTION
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
            'new_message',  -- Use valid type
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

-- 9. CREATE THE TRIGGER
DROP TRIGGER IF EXISTS create_group_message_notification ON messages;
CREATE TRIGGER create_group_message_notification
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION create_group_message_notification();

-- 10. VERIFY EVERYTHING IS FIXED
SELECT 'NOTIFICATIONS SYSTEM FIXED' as status;
