-- FIX GROUP MESSAGE NOTIFICATIONS
-- This will create proper notifications for group messages
-- Run this in your Supabase SQL editor

-- 1. FIRST, CHECK WHAT NOTIFICATION TYPES ARE ALLOWED
SELECT 'CHECKING NOTIFICATION TYPES' as section;

SELECT DISTINCT type, COUNT(*) as count
FROM notifications 
GROUP BY type
ORDER BY type;

-- 2. CREATE A SIMPLE GROUP MESSAGE NOTIFICATION FUNCTION
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
            data
        ) VALUES (
            participant_record.user_id,
            'group_message',  -- Now that we've updated the constraint to allow this type
            'New Group Message',
            COALESCE(sender_name, 'Someone') || ' sent a message in ' || COALESCE(event_title, 'the event'),
            'View Message',
            '💬',
            false,
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

-- 3. CREATE THE TRIGGER
DROP TRIGGER IF EXISTS create_group_message_notification ON messages;
CREATE TRIGGER create_group_message_notification
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION create_group_message_notification();

-- 4. TEST THE FUNCTION
SELECT 'GROUP MESSAGE NOTIFICATIONS ENABLED' as status;
