-- Audit unread counts for the current user across BOTH private and group conversations
-- Logic matches frontend: count messages where sender_id != me AND created_at > last_read_at

WITH me AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE id = auth.uid()
),

my_parts AS (
  SELECT up.conversation_id, up.conversation_type, up.last_read_at, m.user_id
  FROM unified_participants up
  JOIN me m ON up.user_id = m.user_id
),

unread AS (
  SELECT
    mp.conversation_id,
    mp.conversation_type,
    COUNT(um.id) AS unread_count,
    MAX(um.created_at) AS latest_msg_time
  FROM my_parts mp
  LEFT JOIN unified_messages um
    ON um.conversation_id = mp.conversation_id
   AND um.sender_id <> mp.user_id
   AND um.created_at > COALESCE(mp.last_read_at, '1970-01-01'::timestamptz)
  GROUP BY mp.conversation_id, mp.conversation_type
)

SELECT *
FROM unread
ORDER BY latest_msg_time DESC NULLS LAST;



