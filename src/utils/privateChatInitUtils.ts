import { supabase } from '@/lib/supabaseClient';

/**
 * Initialize a private chat between talent and promoter
 * This ensures both participants are added to the chat
 */
export const initializePrivateChat = async (talentId: string, promoterId: string): Promise<string | null> => {
  try {
    console.log('🔍 Initializing private chat between talent:', talentId, 'and promoter:', promoterId);
    
    // Create chat ID in format: talentId-promoterId
    const chatId = `${talentId}-${promoterId}`;
    
    // Check if chat already exists
    const { data: existingChat, error: checkError } = await supabase
      .from('private_chat_participants')
      .select('chat_id')
      .eq('chat_id', chatId)
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing chat:', checkError);
      return null;
    }
    
    if (existingChat && existingChat.length > 0) {
      console.log('✅ Private chat already exists:', chatId);
      return chatId;
    }
    
    // Create chat participants for both users
    const participants = [
      { chat_id: chatId, user_id: talentId },
      { chat_id: chatId, user_id: promoterId }
    ];
    
    const { error: insertError } = await supabase
      .from('private_chat_participants')
      .insert(participants);
    
    if (insertError) {
      console.error('❌ Error creating private chat participants:', insertError);
      return null;
    }
    
    console.log('✅ Private chat initialized successfully:', chatId);
    return chatId;
    
  } catch (error) {
    console.error('❌ Error initializing private chat:', error);
    return null;
  }
};

/**
 * Ensure a user is added to a group chat for an event
 */
export const ensureGroupChatParticipation = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    console.log('🔍 Ensuring group chat participation for user:', userId, 'in event:', eventId);
    
    // Check if user is already a participant
    const { data: existingParticipant, error: checkError } = await supabase
      .from('message_participants')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing participation:', checkError);
      return false;
    }
    
    if (existingParticipant) {
      console.log('✅ User already participates in group chat');
      return true;
    }
    
    // Add user to group chat
    const { error: insertError } = await supabase
      .from('message_participants')
      .insert({
        event_id: eventId,
        user_id: userId
      });
    
    if (insertError) {
      console.error('❌ Error adding user to group chat:', insertError);
      return false;
    }
    
    console.log('✅ User added to group chat successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error ensuring group chat participation:', error);
    return false;
  }
};

/**
 * Get or create a private chat between talent and promoter
 */
export const getOrCreatePrivateChat = async (talentId: string, promoterId: string): Promise<string | null> => {
  try {
    console.log('🔍 Getting or creating private chat between talent:', talentId, 'and promoter:', promoterId);
    
    // Try to initialize the chat (this will create it if it doesn't exist)
    const chatId = await initializePrivateChat(talentId, promoterId);
    
    if (!chatId) {
      console.error('❌ Failed to initialize private chat');
      return null;
    }
    
    return chatId;
    
  } catch (error) {
    console.error('❌ Error getting or creating private chat:', error);
    return null;
  }
};

/**
 * Send a private message and ensure proper delivery
 */
export const sendPrivateMessageWithDelivery = async (
  chatId: string, 
  senderId: string, 
  messageText: string
): Promise<boolean> => {
  try {
    console.log('🔍 Sending private message with delivery check:', { chatId, senderId, messageText: messageText.substring(0, 50) + '...' });
    
    // First, ensure the chat exists and has participants
    const { data: participants, error: participantsError } = await supabase
      .from('private_chat_participants')
      .select('user_id')
      .eq('chat_id', chatId);
    
    if (participantsError) {
      console.error('❌ Error checking chat participants:', participantsError);
      return false;
    }
    
    if (!participants || participants.length < 2) {
      console.error('❌ Chat does not have both participants');
      return false;
    }
    
    // Send the message
    const { data: message, error: messageError } = await supabase
      .from('private_chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        message_text: messageText
      })
      .select('id')
      .single();
    
    if (messageError) {
      console.error('❌ Error sending private message:', messageError);
      return false;
    }
    
    console.log('✅ Private message sent successfully:', message.id);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending private message with delivery:', error);
    return false;
  }
};
