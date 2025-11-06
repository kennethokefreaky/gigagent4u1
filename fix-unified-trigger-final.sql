-- FIX UNIFIED TRIGGER FINAL - BULLETPROOF UUID EXTRACTION
-- The conversation_id format is: "private_talentId-promoterId"
-- We need to extract the full UUIDs correctly

-- 1. DROP THE BROKEN TRIGGER
DROP TRIGGER IF EXISTS ensure_unified_participants ON unified_messages;

-- 2. CREATE BULLETPROOF TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION ensure_unified_participants()
RETURNS TRIGGER AS $$
DECLARE
  talent_id UUID;
  promoter_id UUID;
  conversation_without_prefix TEXT;
  first_dash_position INTEGER;
BEGIN
  -- For private chats: add both talent and promoter
  IF NEW.conversation_type = 'private' THEN
    -- Remove "private_" prefix (8 characters)
    conversation_without_prefix := substring(NEW.conversation_id FROM 9);
    
    -- Find the position of the first dash after the talent UUID
    -- UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
    -- So the first dash is at position 9, second at 14, third at 19, fourth at 24
    -- The promoter UUID starts after the 4th dash (position 25)
    first_dash_position := position('-' IN conversation_without_prefix);
    
    -- Extract talent UUID (first 36 characters)
    talent_id := substring(conversation_without_prefix FROM 1 FOR 36);
    
    -- Extract promoter UUID (everything after the 4th dash)
    promoter_id := substring(conversation_without_prefix FROM 37);
    
    -- Debug logging (remove in production)
    RAISE NOTICE 'Extracted talent_id: %, promoter_id: %', talent_id, promoter_id;
    
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
SELECT 'Unified trigger FINAL created - bulletproof UUID extraction' as status;
