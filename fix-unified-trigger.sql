-- FIX UNIFIED TRIGGER - CORRECT UUID EXTRACTION
-- The trigger is using wrong split positions for UUID extraction

-- 1. DROP THE BROKEN TRIGGER
DROP TRIGGER IF EXISTS ensure_unified_participants ON unified_messages;

-- 2. CREATE FIXED TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION ensure_unified_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- For private chats: add both talent and promoter
  IF NEW.conversation_type = 'private' THEN
    DECLARE
      talent_id UUID;
      promoter_id UUID;
    BEGIN
      -- FIXED: Remove "private_" prefix first, then split
      -- conversation_id format: "private_talentId-promoterId"
      -- After removing "private_": "talentId-promoterId"
      -- So split positions are 1 and 2, not 2 and 3
      talent_id := split_part(split_part(NEW.conversation_id, '_', 2), '-', 1);
      promoter_id := split_part(split_part(NEW.conversation_id, '_', 2), '-', 2);
      
      INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
      VALUES (NEW.conversation_id, 'private', talent_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
      
      INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
      VALUES (NEW.conversation_id, 'private', promoter_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END;
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

-- 4. FINAL STATUS
SELECT 'Unified trigger fixed - correct UUID extraction from conversation_id' as status;
