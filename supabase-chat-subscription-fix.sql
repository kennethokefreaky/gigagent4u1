-- Fix for chat subscription issues when table is empty
-- This creates a default chat subscription for users who don't have one

-- 1. Create a function to get or create chat subscription
CREATE OR REPLACE FUNCTION get_or_create_chat_subscription(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  subscription_type TEXT,
  subscription_status TEXT,
  free_chats_used INTEGER,
  free_chats_limit INTEGER,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Try to get existing subscription
  RETURN QUERY
  SELECT 
    cs.id,
    cs.user_id,
    cs.subscription_type,
    cs.subscription_status,
    cs.free_chats_used,
    cs.free_chats_limit,
    cs.subscription_start_date,
    cs.subscription_end_date,
    cs.created_at,
    cs.updated_at
  FROM chat_subscriptions cs
  WHERE cs.user_id = user_uuid;
  
  -- If no subscription found, create a default one
  IF NOT FOUND THEN
    INSERT INTO chat_subscriptions (
      user_id,
      subscription_type,
      subscription_status,
      free_chats_used,
      free_chats_limit,
      subscription_start_date,
      subscription_end_date,
      created_at,
      updated_at
    ) VALUES (
      user_uuid,
      'free',
      'active',
      0,
      15,
      NOW(),
      NULL,
      NOW(),
      NOW()
    );
    
    -- Return the newly created subscription
    RETURN QUERY
    SELECT 
      cs.id,
      cs.user_id,
      cs.subscription_type,
      cs.subscription_status,
      cs.free_chats_used,
      cs.free_chats_limit,
      cs.subscription_start_date,
      cs.subscription_end_date,
      cs.created_at,
      cs.updated_at
    FROM chat_subscriptions cs
    WHERE cs.user_id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a trigger to automatically create chat subscription when a user is created
CREATE OR REPLACE FUNCTION create_chat_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default chat subscription for the new user
  INSERT INTO chat_subscriptions (
    user_id,
    subscription_type,
    subscription_status,
    free_chats_used,
    free_chats_limit,
    subscription_start_date,
    subscription_end_date,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'free',
    'active',
    0,
    15,
    NOW(),
    NULL,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger (if it doesn't exist)
DROP TRIGGER IF EXISTS create_chat_subscription_trigger ON auth.users;
CREATE TRIGGER create_chat_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_subscription_for_new_user();

-- 4. Create default chat subscriptions for existing users who don't have one
INSERT INTO chat_subscriptions (
  user_id,
  subscription_type,
  subscription_status,
  free_chats_used,
  free_chats_limit,
  subscription_start_date,
  subscription_end_date,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'free',
  'active',
  0,
  15,
  NOW(),
  NULL,
  NOW(),
  NOW()
FROM profiles p
WHERE p.id NOT IN (
  SELECT user_id FROM chat_subscriptions
);

-- 5. Update the chatLimitUtils to use the new function
-- This will be handled in the TypeScript code
