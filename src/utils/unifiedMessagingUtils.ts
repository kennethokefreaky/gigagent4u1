import { supabase } from '@/lib/supabaseClient';

export interface UnifiedMessage {
  id: string;
  conversation_id: string;
  conversation_type: 'private' | 'group';
  sender_id: string;
  message_text: string;
  created_at: string;
  updated_at: string;
  sender_name: string;
  sender_avatar?: string;
}

export interface UnifiedParticipant {
  id: string;
  conversation_id: string;
  conversation_type: 'private' | 'group';
  user_id: string;
  joined_at: string;
  last_read_at: string;
}

// Get messages for a conversation
export const getUnifiedMessages = async (conversationId: string, userId: string): Promise<UnifiedMessage[]> => {
  try {
    console.log('🔍 Getting unified messages for conversation:', conversationId, 'userId:', userId);
    
    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('unified_messages')
      .select('id, conversation_id, conversation_type, sender_id, message_text, created_at, updated_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Error getting unified messages:', messagesError);
      return [];
    }

    // Transform the data to match our interface
    const transformedMessages: UnifiedMessage[] = await Promise.all(
      (messages || []).map(async (msg) => {
        // Get sender info separately
        const { data: sender } = await supabase
          .from('profiles')
          .select('full_name, email, profile_image_url')
          .eq('id', msg.sender_id)
          .single();

        // Check if current user is the sender
        const isCurrentUser = msg.sender_id === userId;
        
        // Determine sender name with proper fallbacks
        let senderName = 'Unknown';
        if (!isCurrentUser && sender) {
          if (sender.full_name) {
            senderName = sender.full_name;
          } else if (sender.email) {
            senderName = sender.email.split('@')[0]; // Use email prefix as fallback
          }
        }
        
        return {
          id: msg.id,
          conversation_id: msg.conversation_id,
          conversation_type: msg.conversation_type,
          sender_id: msg.sender_id,
          message_text: msg.message_text,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          sender_name: isCurrentUser ? 'You' : senderName,
          sender_avatar: isCurrentUser ? null : sender?.profile_image_url
        };
      })
    );

    console.log('✅ Unified messages fetched:', transformedMessages.length);
    return transformedMessages;
  } catch (error) {
    console.error('Error getting unified messages:', error);
    return [];
  }
};

// Send a message
export const sendUnifiedMessage = async (
  conversationId: string, 
  conversationType: 'private' | 'group',
  senderId: string, 
  messageText: string
): Promise<UnifiedMessage | null> => {
  try {
    console.log('🚀 Sending unified message:', { conversationId, conversationType, senderId, messageText: messageText.substring(0, 50) + '...' });
    console.log('🔍 DEBUG: senderId value:', senderId);
    console.log('🔍 DEBUG: senderId type:', typeof senderId);
    console.log('🔍 DEBUG: senderId length:', senderId?.length);
    
    // For private chats, ensure both participants are added
    if (conversationType === 'private') {
      // Extract talent and promoter IDs from conversation_id
      // Format: private_talentId-promoterId
      const withoutPrefix = conversationId.replace('private_', '');
      
      // Split by the dash that separates the two UUIDs (not every dash)
      // UUIDs are 36 characters, so we need to find the dash at position 36
      const talentId = withoutPrefix.substring(0, 36);
      const promoterId = withoutPrefix.substring(37); // Skip the dash at position 36
      
      console.log('🔍 Extracted UUIDs:', { talentId, promoterId, withoutPrefix });
      
      // Add both participants
      await supabase
        .from('unified_participants')
        .upsert([
          { conversation_id: conversationId, conversation_type: 'private', user_id: talentId },
          { conversation_id: conversationId, conversation_type: 'private', user_id: promoterId }
        ], { onConflict: 'conversation_id,user_id' });
      
      // Create notification for the recipient (using existing notification system)
      const recipientId = senderId === talentId ? promoterId : talentId;
      
      // Get sender name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', senderId)
        .single();
      
      const senderName = senderProfile?.full_name || 'Someone';
      
      // Create notification using existing pattern
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'new_message',
          title: 'New Private Message',
          message: `${senderName} sent you a private message`,
          button_text: 'View Message',
          icon: '💬',
          is_read: false
        });
      
      if (notificationError) {
        console.error('Error creating private message notification:', notificationError);
      } else {
        console.log('✅ Private message notification created');
        // Trigger notification refresh
        window.dispatchEvent(new CustomEvent('notificationCreated'));
        // Also trigger message badge refresh
        window.dispatchEvent(new CustomEvent('privateMessageSent'));
      }
    }
    
    // Send the message
    const { data: message, error: messageError } = await supabase
      .from('unified_messages')
      .insert({
        conversation_id: conversationId,
        conversation_type: conversationType,
        sender_id: senderId,
        message_text: messageText
      })
      .select('id, conversation_id, conversation_type, sender_id, message_text, created_at, updated_at')
      .single();

    if (messageError) {
      console.error('❌ Error sending unified message:', messageError);
      return null;
    }

    // Get sender info
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name, email, profile_image_url')
      .eq('id', message.sender_id)
      .single();

    // Determine sender name with proper fallbacks
    let senderName = 'Unknown';
    if (sender) {
      if (sender.full_name) {
        senderName = sender.full_name;
      } else if (sender.email) {
        senderName = sender.email.split('@')[0]; // Use email prefix as fallback
      }
    }

    const result: UnifiedMessage = {
      id: message.id,
      conversation_id: message.conversation_id,
      conversation_type: message.conversation_type,
      sender_id: message.sender_id,
      message_text: message.message_text,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender_name: senderName,
      sender_avatar: sender?.profile_image_url
    };

    console.log('✅ Unified message sent successfully');
    
    // Dispatch event to refresh badges
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('unifiedMessageSent'));
    }
    
    return result;
  } catch (error) {
    console.error('Error sending unified message:', error);
    return null;
  }
};

// Get user's conversations
export const getUserConversations = async (userId: string): Promise<Array<{
  conversation_id: string;
  conversation_type: 'private' | 'group';
  other_user_id?: string;
  other_user_name?: string;
  other_user_email?: string;
  event_title?: string;
  last_message?: string | { message_text: string; created_at: string; sender_name: string };
  last_message_time?: string;
  unread_count: number;
}>> => {
  try {
    console.log('🔍 Getting unified conversations for user:', userId);
    
    // Get the user's conversations
    const { data: participants, error: participantsError } = await supabase
      .from('unified_participants')
      .select('conversation_id, conversation_type, last_read_at')
      .eq('user_id', userId);

    if (participantsError) {
      console.error('❌ Error getting unified participants:', participantsError);
      return [];
    }

    console.log('🔍 DEBUG: Raw participants data:', participants);
    console.log('🔍 DEBUG: Number of participants found:', participants?.length || 0);

    if (!participants || participants.length === 0) {
      console.log('✅ No unified participants found');
      return [];
    }

    // Get conversation details
    const conversations = await Promise.all(
      participants.map(async (participant) => {
        const conversationId = participant.conversation_id;
        const conversationType = participant.conversation_type;

        // Get last message with sender info
        const { data: lastMessage } = await supabase
          .from('unified_messages')
          .select('message_text, created_at, sender_id')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // For group chats, include even if no messages (they should be visible)
        // For private chats, only include if they have messages
        if (!lastMessage && conversationType === 'private') {
          console.log('🔍 Skipping private conversation with no messages:', conversationId);
          return null;
        }
        
        if (!lastMessage && conversationType === 'group') {
          console.log('🔍 Including group conversation with no messages:', conversationId);
        }

        console.log('🔍 DEBUG: Processing conversation:', { conversationId, conversationType, hasLastMessage: !!lastMessage });

        // Get unread count (exclude messages sent by current user)
        const { count: unreadCount } = await supabase
          .from('unified_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userId) // Don't count messages sent by current user
          .gt('created_at', participant.last_read_at || '1970-01-01');
        
        console.log('🔍 DEBUG: Unread count for conversation:', {
          conversationId,
          conversationType,
          unreadCount,
          lastReadAt: participant.last_read_at
        });

        // Get sender name for last message
        let senderName = 'Unknown';
        if (lastMessage && lastMessage.sender_id) {
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', lastMessage.sender_id)
            .single();
          
          if (sender) {
            if (sender.full_name) {
              senderName = sender.full_name;
            } else if (sender.email) {
              senderName = sender.email.split('@')[0]; // Use email prefix as fallback
            }
          }
        }

        let conversationData: any = {
          conversation_id: conversationId,
          conversation_type: conversationType,
          last_message: lastMessage ? {
            message_text: lastMessage.message_text,
            created_at: lastMessage.created_at,
            sender_name: senderName
          } : null,
          last_message_time: lastMessage?.created_at || new Date().toISOString(),
          unread_count: unreadCount || 0
        };

        if (conversationType === 'private') {
          // For private chats, get the other user
          // Format: private_talentId-promoterId
          const withoutPrefix = conversationId.replace('private_', '');
          const talentId = withoutPrefix.substring(0, 36);
          const promoterId = withoutPrefix.substring(37); // Skip the dash at position 36
          
          // Determine which user is the "other" user (not the current user)
          const otherUserId = talentId === userId ? promoterId : talentId;
          
          console.log('🔍 DEBUG: Private chat user resolution:', { 
            conversationId, 
            talentId, 
            promoterId, 
            currentUserId: userId, 
            otherUserId 
          });
          
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', otherUserId)
            .single();

          console.log('🔍 DEBUG: Other user data:', { otherUserId, otherUser });

          // Use promoter name with proper fallbacks
          let displayName = 'Unknown';
          if (otherUser?.full_name) {
            displayName = otherUser.full_name;
          } else if (otherUser?.email) {
            displayName = otherUser.email.split('@')[0]; // Use email prefix as fallback
          }

          conversationData.other_user_id = otherUserId;
          conversationData.other_user_name = displayName;
          conversationData.other_user_email = otherUser?.email || '';
        } else {
          // For group chats, get the event title and check if event exists
          const eventId = conversationId.replace('group_', '');
          
          // Check if event exists in posts table (active events)
          const { data: activeEvent } = await supabase
            .from('posts')
            .select('title')
            .eq('id', eventId)
            .single();

          // Check if event exists in trash table (ended events)
          const { data: trashedEvent } = await supabase
            .from('trash')
            .select('post_data')
            .eq('original_post_id', eventId)
            .single();

          // If event is in trash (ended), skip this conversation
          if (trashedEvent) {
            console.log('🚫 Skipping group chat for ended event:', eventId);
            return null;
          }

          // If event doesn't exist in either table, skip it
          if (!activeEvent) {
            console.log('🚫 Skipping group chat for non-existent event:', eventId);
            return null;
          }

          conversationData.event_title = activeEvent.title || 'Group Chat';
        }

        return conversationData;
      })
    );

    // Filter out null values
    const validConversations = conversations.filter(conv => conv !== null);
    
    console.log('✅ Unified conversations fetched:', validConversations.length);
    return validConversations;
  } catch (error) {
    console.error('Error getting unified conversations:', error);
    return [];
  }
};

// Mark messages as read
export const markUnifiedMessagesAsRead = async (conversationId: string, userId: string): Promise<boolean> => {
  try {
    console.log('📖 Marking unified messages as read:', { conversationId, userId });
    
    const { error } = await supabase
      .from('unified_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error marking unified messages as read:', error);
      return false;
    }

    console.log('✅ Unified messages marked as read');
    
    // Dispatch event to refresh badge
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messageRead'));
    }
    
    return true;
  } catch (error) {
    console.error('Error marking unified messages as read:', error);
    return false;
  }
};

// Create private conversation ID
export const createPrivateConversationId = (talentId: string, promoterId: string): string => {
  return `private_${talentId}-${promoterId}`;
};

// Create group conversation ID
export const createGroupConversationId = (eventId: string): string => {
  return `group_${eventId}`;
};
