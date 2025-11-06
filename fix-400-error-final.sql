-- FIX 400 ERROR - REMOVE ALL PROBLEMATIC TRIGGERS
-- The 400 error is caused by conflicting or broken triggers

-- 1. DROP ALL EXISTING TRIGGERS
DROP TRIGGER IF EXISTS ensure_unified_participants ON unified_messages;
DROP TRIGGER IF EXISTS simple_ensure_participants ON unified_messages;
DROP TRIGGER IF EXISTS create_unified_notification ON unified_messages;

-- 2. DROP ALL EXISTING FUNCTIONS
DROP FUNCTION IF EXISTS ensure_unified_participants();
DROP FUNCTION IF EXISTS simple_ensure_participants();
DROP FUNCTION IF EXISTS create_unified_notification();

-- 3. CREATE SIMPLE TRIGGER THAT WORKS
CREATE OR REPLACE FUNCTION add_sender_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- Just add the sender as a participant (no complex logic)
  INSERT INTO unified_participants (conversation_id, conversation_type, user_id)
  VALUES (NEW.conversation_id, NEW.conversation_type, NEW.sender_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CREATE THE SIMPLE TRIGGER
CREATE TRIGGER add_sender_as_participant
  AFTER INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION add_sender_as_participant();

-- 5. SUCCESS MESSAGE
SELECT '400 error fix applied - simple trigger only' as status;

