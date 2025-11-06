-- Add field to track if user has ever subscribed to prevent going back to subscription page
-- This ensures talents who have subscribed never go back to the subscription page

-- 1. Add has_ever_subscribed field to chat_subscriptions table
ALTER TABLE chat_subscriptions 
ADD COLUMN IF NOT EXISTS has_ever_subscribed BOOLEAN DEFAULT FALSE;

-- 2. Update existing premium subscriptions to mark them as having subscribed
UPDATE chat_subscriptions 
SET has_ever_subscribed = TRUE 
WHERE subscription_type = 'premium';

-- 3. Update the upgradeToPremium function to set has_ever_subscribed = TRUE
CREATE OR REPLACE FUNCTION upgrade_to_premium_with_tracking(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- First check if user has a chat subscription record
  IF EXISTS (SELECT 1 FROM chat_subscriptions WHERE user_id = user_uuid) THEN
    -- Update existing subscription
    UPDATE chat_subscriptions 
    SET 
      subscription_type = 'premium',
      subscription_status = 'active',
      has_ever_subscribed = TRUE,
      subscription_start_date = NOW(),
      subscription_end_date = NOW() + INTERVAL '30 days',
      updated_at = NOW()
    WHERE user_id = user_uuid;
  ELSE
    -- Create new subscription
    INSERT INTO chat_subscriptions (
      user_id,
      subscription_type,
      subscription_status,
      has_ever_subscribed,
      free_chats_used,
      free_chats_limit,
      subscription_start_date,
      subscription_end_date,
      created_at,
      updated_at
    ) VALUES (
      user_uuid,
      'premium',
      'active',
      TRUE,
      0,
      15,
      NOW(),
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
