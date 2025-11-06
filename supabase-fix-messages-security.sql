-- Fix security issues in messages RLS policies
-- Run this in your Supabase SQL Editor to tighten security

-- Step 1: Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can join conversations" ON message_participants;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_read_status;
DROP POLICY IF EXISTS "Users can send messages for their events" ON messages;

-- Step 2: Create more secure policies

-- Users can join conversations (but only for events they have access to)
CREATE POLICY "Users can join conversations securely" ON message_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (
      -- User can join if they are the event promoter
      event_id IN (SELECT id FROM posts WHERE promoter_id = auth.uid()) OR
      -- User can join if they are already a candidate for this event
      event_id IN (SELECT event_id FROM candidates WHERE talent_id = auth.uid()) OR
      -- User can join if they have applied to this event
      event_id IN (SELECT event_id FROM applications WHERE talent_id = auth.uid())
    )
  );

-- Users can mark messages as read (but only for their own messages)
CREATE POLICY "Users can mark messages as read securely" ON message_read_status
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    message_id IN (
      SELECT m.id FROM messages m
      JOIN message_participants mp ON m.event_id = mp.event_id
      WHERE mp.user_id = auth.uid()
    )
  );

-- Users can send messages for their events (but only if they're participants)
CREATE POLICY "Users can send messages for their events securely" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    event_id IN (
      SELECT event_id FROM message_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Step 3: Verify the updated policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename IN ('messages', 'message_participants', 'message_read_status')
ORDER BY tablename, policyname;
