-- FIX UNIFIED TRIGGER - CORRECT UUID EXTRACTION (FINAL)
-- The issue: The trigger is adding a leading dash to the promoter UUID
-- Error: invalid input syntax for type uuid: "-226a554f-f102-4547-8ff4-d16c9fbaf8e5"

-- 1. DROP THE BROKEN TRIGGER
DROP TRIGGER IF EXISTS ensure_unified_participants ON unified_messages;

-- 2. CREATE CORRECT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION ensure_unified_participants()
RETURNS TRIGGER AS $$
DECLARE
  talent_id UUID;
  promoter_id UUID;
  conversation_without_prefix TEXT;
BEGIN
  -- For private chats: add both talent and promoter
  IF NEW.conversation_type = 'private' THEN
    -- Remove "private_" prefix (8 characters)
    conversation_without_prefix := substring(NEW.conversation_id FROM 9);
    
    -- Extract talent UUID (first 36 characters)
    talent_id := substring(conversation_without_prefix FROM 1 FOR 36);
    
    -- Extract promoter UUID (characters 38 onwards, skipping the dash at position 37)
    promoter_id := substring(conversation_without_prefix FROM 38);
    
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

-- 4. SUCCESS MESSAGE
SELECT 'Unified trigger CORRECTED - no leading dash in UUID extraction' as status;

