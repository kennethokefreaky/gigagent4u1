import { supabase } from '@/lib/supabaseClient';
import { initializePrivateChat, sendPrivateMessageWithDelivery } from './privateChatInitUtils';

export interface PrivateChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  updated_at: string;
  sender_name: string;
  sender_avatar?: string;
}

// Get private chat messages using unified system
export const getPrivateChatMessages = async (chatId: string, userId: string): Promise<PrivateChatMessage[]> => {
  try {
    console.log('🔍 Getting private chat messages for chatId:', chatId, 'userId:', userId);
    
    // Convert chatId to unified conversation_id format
    const conversationId = `private_${chatId}`;
    
    // Get messages using unified system
    const { data: messages, error: messagesError } = await supabase
      .rpc('get_unified_messages', {
        conversation_id_param: conversationId,
        user_id_param: userId
      });

    if (messagesError) {
      console.error('❌ Error getting private chat messages:', messagesError);
      return [];
    }

    // Transform the data to match our interface
    const transformedMessages: PrivateChatMessage[] = (messages || []).map((msg) => {
      // Check if current user is the sender
      const isCurrentUser = msg.sender_id === userId;
      
      return {
        id: msg.id,
        chat_id: chatId, // Keep original chatId for compatibility
        sender_id: msg.sender_id,
        message_text: msg.message_text,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        sender_name: isCurrentUser ? 'You' : (msg.sender_name || 'Unknown'),
        sender_avatar: isCurrentUser ? null : msg.sender_avatar
      };
    });

    console.log('✅ Private chat messages fetched:', transformedMessages.length);
    return transformedMessages;
  } catch (error) {
    console.error('Error getting private chat messages:', error);
    return [];
  }
};

// Send private chat message using unified system
export const sendPrivateChatMessage = async (chatId: string, senderId: string, messageText: string): Promise<PrivateChatMessage | null> => {
  try {
    console.log('🚀 Sending private chat message:', { chatId, senderId, messageText: messageText.substring(0, 50) + '...' });
    
    // Convert chatId to unified conversation_id format
    const conversationId = `private_${chatId}`;
    
    // Ensure both participants are in the unified system
    await supabase
      .from('unified_participants')
      .upsert([
        { conversation_id: conversationId, conversation_type: 'private', user_id: chatId.split('-')[0] },
        { conversation_id: conversationId, conversation_type: 'private', user_id: chatId.split('-')[1] }
      ], { onConflict: 'conversation_id,user_id' });

    // Send message using unified system
    const { data: messageId, error: sendError } = await supabase
      .rpc('send_unified_message', {
        conversation_id_param: conversationId,
        conversation_type_param: 'private',
        sender_id_param: senderId,
        message_text_param: messageText
      });

    if (sendError || !messageId) {
      console.error('❌ Error sending private message:', sendError);
      return null;
    }

    // Get the message that was just sent
    const { data: message, error: messageError } = await supabase
      .from('unified_messages')
      .select('id, conversation_id, sender_id, message_text, created_at, updated_at')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      console.error('❌ Error retrieving sent message:', messageError);
      return null;
    }

    // Get sender info
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name, profile_image_url')
      .eq('id', message.sender_id)
      .single();

    const result: PrivateChatMessage = {
      id: message.id,
      chat_id: chatId, // Keep original chatId for compatibility
      sender_id: message.sender_id,
      message_text: message.message_text,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender_name: sender?.full_name || 'Unknown',
      sender_avatar: sender?.profile_image_url
    };

    console.log('✅ Private chat message sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending private chat message:', error);
    return null;
  }
};

// Join private chat
export const joinPrivateChat = async (chatId: string, userId: string): Promise<boolean> => {
  try {
    console.log('🔗 Joining private chat:', { chatId, userId });
    
    // Only add the current user to the chat (RLS allows users to insert their own records)
    const { error } = await supabase
      .from('private_chat_participants')
      .upsert({
        chat_id: chatId,
        user_id: userId,
        joined_at: new Date().toISOString(),
        last_read_at: new Date().toISOString()
      }, {
        onConflict: 'chat_id,user_id'
      });

    if (error) {
      console.error('❌ Error joining private chat:', error);
      return false;
    }

    console.log('✅ Successfully joined private chat');
    return true;
  } catch (error) {
    console.error('Error joining private chat:', error);
    return false;
  }
};

// Mark private chat messages as read
export const markPrivateChatMessagesAsRead = async (chatId: string, userId: string): Promise<boolean> => {
  try {
    console.log('📖 Marking private chat messages as read:', { chatId, userId });
    
    const { error } = await supabase
      .from('private_chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error marking private chat messages as read:', error);
      return false;
    }

    console.log('✅ Private chat messages marked as read');
    
    // Dispatch event to refresh badge
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messageRead'));
    }
    
    return true;
  } catch (error) {
    console.error('Error marking private chat messages as read:', error);
    return false;
  }
};

// Get user's private chat conversations
export const getUserPrivateChats = async (userId: string): Promise<Array<{
  chat_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}>> => {
  try {
    console.log('🔍 Getting private chats for user:', userId);
    
    // Get user's private chat conversations from unified system
    const { data: participants, error: participantsError } = await supabase
      .from('unified_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .eq('conversation_type', 'private');

    if (participantsError) {
      console.error('❌ Error getting private chat participants:', participantsError);
      return [];
    }

    if (!participants || participants.length === 0) {
      console.log('✅ No private chat participants found');
      return [];
    }

    // Get the other participant for each chat
    const chats = await Promise.all(
      participants.map(async (participant) => {
        const conversationId = participant.conversation_id;
        const chatId = conversationId.replace('private_', ''); // Remove prefix to get original chatId
        
        // Extract talentId (first 36 chars) and promoterId (rest after the dash)
        const talentId = chatId.substring(0, 36);
        const promoterId = chatId.substring(37); // Skip the dash
        const otherUserId = talentId === userId ? promoterId : talentId;
        
        // Get other user's info
        const { data: otherUser, error: otherUserError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', otherUserId)
          .single();

        if (otherUserError) {
          console.error('❌ Error fetching other user profile:', otherUserError);
        }

        // Get last message from unified system
        const { data: lastMessage } = await supabase
          .from('unified_messages')
          .select('message_text, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Only include chats that have messages
        if (!lastMessage) {
          console.log('🔍 Skipping chat with no messages:', chatId);
          return null; // Don't include chats without messages
        }

        // Get unread count from unified system
        const { count: unreadCount } = await supabase
          .from('unified_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .gt('created_at', participant.last_read_at || '1970-01-01');

        // Determine the best display name with fallbacks (exact same logic as openmessage)
        let displayName = 'Unknown';
        if (otherUser?.full_name) {
          displayName = otherUser.full_name;
        } else if (otherUser?.email) {
          displayName = otherUser.email.split('@')[0]; // Use email prefix as fallback
        }

        console.log('✅ Other user info fetched:', { displayName, email: otherUser?.email });

        return {
          chat_id: chatId,
          other_user_id: otherUserId,
          other_user_name: displayName,
          other_user_email: otherUser?.email || '',
          last_message: lastMessage.message_text,
          last_message_time: lastMessage.created_at,
          unread_count: unreadCount || 0
        };
      })
    );

    // Filter out null values (chats without messages)
    const validChats = chats.filter(chat => chat !== null);
    
    console.log('✅ Private chats fetched:', validChats.length);
    return validChats;
  } catch (error) {
    console.error('Error getting private chats:', error);
    return [];
  }
};
