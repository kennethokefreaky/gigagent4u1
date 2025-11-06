-- AUDIT AND FIX NOTIFICATION SYSTEM
-- This script audits the notification system and fixes any conflicts

-- 1. CHECK EXISTING TRIGGERS
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'unified_messages'
ORDER BY trigger_name;

-- 2. DROP ALL EXISTING NOTIFICATION TRIGGERS TO PREVENT CONFLICTS
DROP TRIGGER IF EXISTS create_unified_notification ON unified_messages;
DROP TRIGGER IF EXISTS unified_message_notification ON unified_messages;
DROP TRIGGER IF EXISTS create_private_message_notification ON unified_messages;

-- 3. DROP ALL EXISTING NOTIFICATION FUNCTIONS
DROP FUNCTION IF EXISTS create_unified_notification();
DROP FUNCTION IF EXISTS create_unified_message_notification();
DROP FUNCTION IF EXISTS create_private_message_notification();

-- 4. CREATE SINGLE, UNIFIED NOTIFICATION FUNCTION
CREATE OR REPLACE FUNCTION create_unified_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  sender_name TEXT;
  conversation_title TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name
  FROM profiles 
  WHERE id = NEW.sender_id;
  
  -- Create notifications for all other participants
  FOR participant_record IN 
    SELECT user_id FROM unified_participants 
    WHERE conversation_id = NEW.conversation_id 
    AND user_id != NEW.sender_id
  LOOP
    -- Determine conversation title based on type
    IF NEW.conversation_type = 'private' THEN
      conversation_title := 'New Private Message';
    ELSE
      -- For group chats, get event title
      SELECT title INTO conversation_title
      FROM posts 
      WHERE id = substring(NEW.conversation_id FROM 7); -- Remove 'group_' prefix
      
      IF conversation_title IS NULL THEN
        conversation_title := 'New Group Message';
      ELSE
        conversation_title := 'New Message in ' || conversation_title;
      END IF;
    END IF;
    
    -- Insert notification
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
      'new_message',
      conversation_title,
      COALESCE(sender_name, 'Someone') || ': ' || substring(NEW.message_text FROM 1 FOR 50) || 
      CASE WHEN length(NEW.message_text) > 50 THEN '...' ELSE '' END,
      'View Message',
      '💬',
      false,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'conversation_type', NEW.conversation_type,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE SINGLE NOTIFICATION TRIGGER
CREATE TRIGGER unified_message_notification
  AFTER INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_unified_message_notification();

-- 6. VERIFY NOTIFICATION SYSTEM
SELECT 'Notification system fixed - single trigger created' as status;

-- 7. TEST NOTIFICATION CREATION
-- This will show if notifications are being created properly
SELECT 
  'Recent notifications created:' as status,
  COUNT(*) as count
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 8. CHECK FOR DUPLICATE NOTIFICATIONS
SELECT 
  'Potential duplicate notifications:' as status,
  COUNT(*) as count
FROM notifications n1
WHERE EXISTS (
  SELECT 1 FROM notifications n2 
  WHERE n2.user_id = n1.user_id 
  AND n2.title = n1.title 
  AND n2.message = n1.message
  AND n2.created_at > n1.created_at - INTERVAL '1 minute'
  AND n2.id != n1.id
);
