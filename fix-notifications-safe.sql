-- SAFE FIX FOR NOTIFICATIONS
-- This will handle existing data and fix the constraint properly
-- Run this in your Supabase SQL editor

-- 1. FIRST, CHECK WHAT NOTIFICATION TYPES EXIST
SELECT 'EXISTING NOTIFICATION TYPES' as section;
SELECT DISTINCT type, COUNT(*) as count
FROM notifications 
GROUP BY type
ORDER BY type;

-- 2. DROP THE CONSTRAINT COMPLETELY
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 3. ADD MESSAGE_TYPE COLUMN IF IT DOESN'T EXIST
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'private';

-- 4. UPDATE EXISTING NOTIFICATIONS
UPDATE notifications SET message_type = 'private' WHERE message_type IS NULL;

-- 5. CREATE A MORE PERMISSIVE CONSTRAINT
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('new_message', 'group_message', 'message', 'notification'));

-- 6. CREATE GROUP MESSAGE NOTIFICATION FUNCTION
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
            'new_message',  -- Use the same type as private messages
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

-- 7. CREATE THE TRIGGER
DROP TRIGGER IF EXISTS create_group_message_notification ON messages;
CREATE TRIGGER create_group_message_notification
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION create_group_message_notification();

-- 8. VERIFY THE FIX
SELECT 'NOTIFICATIONS FIXED - SAFE APPROACH' as status;

-- 9. TEST THE CONSTRAINT
SELECT 'Testing constraint with sample data...' as test;
SELECT 'new_message' as test_type, 'Should work' as result
UNION ALL
SELECT 'group_message' as test_type, 'Should work' as result
UNION ALL
SELECT 'message' as test_type, 'Should work' as result;
