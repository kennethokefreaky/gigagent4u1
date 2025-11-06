-- SIMPLE MESSAGING FIX - NO UUID EXTRACTION
-- Just disable the problematic trigger and let the app handle participants

-- 1. DROP THE PROBLEMATIC TRIGGER
DROP TRIGGER IF EXISTS ensure_unified_participants ON unified_messages;

-- 2. DROP THE PROBLEMATIC FUNCTION
DROP FUNCTION IF EXISTS ensure_unified_participants();

-- 3. CREATE SIMPLE TRIGGER THAT JUST ADDS THE SENDER
CREATE OR REPLACE FUNCTION simple_ensure_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Just add the sender as a participant (no UUID extraction)
  INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
  VALUES (NEW.conversation_id, NEW.conversation_type, NEW.sender_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CREATE SIMPLE TRIGGER
CREATE TRIGGER simple_ensure_participants
  BEFORE INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION simple_ensure_participants();

-- 5. SUCCESS MESSAGE
SELECT 'Simple messaging fix applied - no UUID extraction, just adds sender' as status;

