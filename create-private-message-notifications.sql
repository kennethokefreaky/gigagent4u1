-- CREATE PRIVATE MESSAGE NOTIFICATIONS
-- This creates notifications when private messages are sent

-- 1. CREATE NOTIFICATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION create_private_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conversation_without_prefix TEXT;
BEGIN
  -- Only create notifications for private messages
  IF NEW.conversation_type = 'private' THEN
    -- Extract recipient ID from conversation_id
    -- Format: private_talentId-promoterId
    conversation_without_prefix := substring(NEW.conversation_id FROM 9); -- Skip "private_"
    
    -- Get the recipient (the one who didn't send the message)
    IF NEW.sender_id = substring(conversation_without_prefix FROM 1 FOR 36) THEN
      -- Sender is talent, recipient is promoter
      recipient_id := substring(conversation_without_prefix FROM 38);
    ELSE
      -- Sender is promoter, recipient is talent
      recipient_id := substring(conversation_without_prefix FROM 1 FOR 36);
    END IF;
    
    -- Get sender name
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
    
    -- Create notification for recipient
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      button_text,
      icon,
      is_read,
      show_confetti
    ) VALUES (
      recipient_id,
      'new_message',
      'New Private Message',
      COALESCE(sender_name, 'Someone') || ' sent you a private message',
      'View Message',
      '💬',
      false,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. CREATE THE NOTIFICATION TRIGGER
CREATE TRIGGER create_private_message_notification
  AFTER INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_private_message_notification();

-- 3. SUCCESS MESSAGE
SELECT 'Private message notifications created successfully' as status;

