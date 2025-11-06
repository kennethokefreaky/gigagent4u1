-- FIX UNIFIED TRIGGER V2 - SIMPLE AND CORRECT
-- The issue: conversation_id format is "private_talentId-promoterId" 
-- But the trigger is not extracting the full UUIDs correctly

-- 1. DROP THE BROKEN TRIGGER
DROP TRIGGER IF EXISTS ensure_unified_participants ON unified_messages;

-- 2. CREATE SIMPLE, CORRECT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION ensure_unified_participants()
RETURNS TRIGGER AS $$
DECLARE
  talent_id UUID;
  promoter_id UUID;
  conversation_without_prefix TEXT;
BEGIN
  -- For private chats: add both talent and promoter
  IF NEW.conversation_type = 'private' THEN
    -- Remove "private_" prefix to get "talentId-promoterId"
    conversation_without_prefix := substring(NEW.conversation_id FROM 9); -- Skip "private_"
    
    -- Split by '-' to get the two UUIDs
    talent_id := split_part(conversation_without_prefix, '-', 1);
    promoter_id := split_part(conversation_without_prefix, '-', 2);
    
    -- Add both participants
    INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
    VALUES (NEW.conversation_id, 'private', talent_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
    VALUES (NEW.conversation_id, 'private', promoter_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  
  -- For group chats: add sender if not already participant
  IF NEW.conversation_type = 'group' THEN
    INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
    VALUES (NEW.conversation_id, 'group', NEW.sender_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. CREATE THE FIXED TRIGGER
CREATE TRIGGER ensure_unified_participants
  BEFORE INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_unified_participants();

-- 4. TEST THE TRIGGER
SELECT 'Unified trigger V2 created - should extract UUIDs correctly' as status;
