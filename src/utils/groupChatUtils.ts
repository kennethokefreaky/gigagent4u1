import { supabase } from '@/lib/supabaseClient';

export interface GroupChatMessage {
  id: string;
  event_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  updated_at: string;
  sender_name: string;
  sender_avatar?: string;
}

export interface GroupChatParticipant {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user_name: string;
  user_avatar?: string;
}

// Join a group chat for an event using OLD SYSTEM (WORKING)
export const joinGroupChat = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    console.log('🔗 Joining group chat for event:', { eventId, userId });
    
    // Use the OLD working system - message_participants table
    const { error } = await supabase
      .from('message_participants')
      .upsert({
        event_id: eventId,
        user_id: userId,
        joined_at: new Date().toISOString()
      }, {
        onConflict: 'event_id,user_id'
      });

    if (error) {
      console.error('❌ Error joining group chat:', error);
      return false;
    }

    console.log('✅ Successfully joined group chat');
    return true;
  } catch (error) {
    console.error('Error joining group chat:', error);
    return false;
  }
};

// Get group chat messages for an event
export const getGroupChatMessages = async (eventId: string, userId: string): Promise<GroupChatMessage[]> => {
  try {
    console.log('🔍 Getting group chat messages for eventId:', eventId, 'userId:', userId);
    
    // Check if user is a participant in EITHER system
    const conversationId = `group_${eventId}`;
    
    // Check unified_participants first (where talents are added when they apply)
    const { data: unifiedParticipant, error: unifiedError } = await supabase
      .from('unified_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    // Check message_participants as fallback
    const { data: messageParticipant, error: messageError } = await supabase
      .from('message_participants')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    // User must be in at least one system
    if ((unifiedError || !unifiedParticipant) && (messageError || !messageParticipant)) {
      console.error('❌ User is not a participant in this group chat:', { unifiedError, messageError });
      return [];
    }

    console.log('✅ User is a participant in group chat (unified:', !!unifiedParticipant, 'message:', !!messageParticipant, ')');

    // Get messages for this event using OLD SYSTEM - messages table
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, event_id, sender_id, message_text, created_at, updated_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Error getting group chat messages:', messagesError);
      return [];
    }

    // Transform the data to match our interface with proper error handling
    const transformedMessages: GroupChatMessage[] = await Promise.all(
      (messages || [])
        .filter(msg => msg && msg.id) // Filter out any undefined or invalid messages
        .map(async (msg) => {
          // Check if current user is the sender
          const isCurrentUser = msg.sender_id === userId;
          
          // Get sender info for each message
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, email, profile_image_url')
            .eq('id', msg.sender_id)
            .single();
          
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
            event_id: eventId, // Use the original eventId
            sender_id: msg.sender_id,
            message_text: msg.message_text || '',
            created_at: msg.created_at,
            updated_at: msg.updated_at,
            sender_name: isCurrentUser ? 'You' : senderName,
            sender_avatar: isCurrentUser ? null : sender?.profile_image_url
          };
        })
    );

    console.log('✅ Group chat messages fetched:', transformedMessages.length);
    return transformedMessages;
  } catch (error) {
    console.error('Error getting group chat messages:', error);
    return [];
  }
};

// Send a message to a group chat using unified messaging
export const sendGroupChatMessage = async (eventId: string, senderId: string, messageText: string): Promise<GroupChatMessage | null> => {
  try {
    console.log('🚀 Sending group chat message:', { eventId, senderId, messageText: messageText.substring(0, 50) + '...' });
    
    // Check if sender is a participant in EITHER system
    const conversationId = `group_${eventId}`;
    
    // Check unified_participants first (where talents are added when they apply)
    const { data: unifiedParticipant, error: unifiedError } = await supabase
      .from('unified_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)
      .single();

    // Check message_participants as fallback
    const { data: messageParticipant, error: messageError } = await supabase
      .from('message_participants')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('user_id', senderId)
      .single();

    // User must be in at least one system
    if ((unifiedError || !unifiedParticipant) && (messageError || !messageParticipant)) {
      console.error('❌ User is not a participant in this group chat:', { unifiedError, messageError });
      return null;
    }

    console.log('✅ User is a participant in group chat (unified:', !!unifiedParticipant, 'message:', !!messageParticipant, ')');

    // Use OLD SYSTEM - messages table (WORKING)
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        event_id: eventId,
        sender_id: senderId,
        message_text: messageText
      })
      .select('id, event_id, sender_id, message_text, created_at, updated_at')
      .single();

    if (insertError) {
      console.error('❌ Error sending group chat message:', insertError);
      return null;
    }

    // Get sender info manually since we're not using functions
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
        senderName = sender.email; // Use full email as fallback
      }
    }

    const result: GroupChatMessage = {
      id: message.id,
      event_id: eventId, // Use the original eventId
      sender_id: message.sender_id,
      message_text: message.message_text,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender_name: senderName,
      sender_avatar: sender?.profile_image_url
    };

    // Mirror to unified system so message badges count this group message
    try {
      const conversationId = `group_${eventId}`;

      // Ensure unified_participants has everyone currently in the group (sender + recipients)
      const { data: mpUsers } = await supabase
        .from('message_participants')
        .select('user_id')
        .eq('event_id', eventId);

      const upserts = (mpUsers || []).map((u) => ({
        conversation_id: conversationId,
        conversation_type: 'group' as const,
        user_id: u.user_id
      }));
      // Always include sender in case not present in message_participants yet
      upserts.push({ conversation_id: conversationId, conversation_type: 'group' as const, user_id: senderId });

      if (upserts.length > 0) {
        await supabase
          .from('unified_participants')
          .upsert(upserts, { onConflict: 'conversation_id,user_id' });
      }

      // Insert unified message for badge calculations
      await supabase
        .from('unified_messages')
        .insert({
          conversation_id: conversationId,
          conversation_type: 'group',
          sender_id: senderId,
          message_text: messageText
        });
    } catch (mirrorErr) {
      console.error('Error mirroring group message to unified system:', mirrorErr);
    }

    // Dispatch global events so UI badge counts refresh immediately
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('unifiedMessageSent'));
      } catch {}
    }

    console.log('✅ Group chat message sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending group chat message:', error);
    return null;
  }
};

// Get group chat participants for an event
export const getGroupChatParticipants = async (eventId: string): Promise<GroupChatParticipant[]> => {
  try {
    console.log('🔍 Getting group chat participants for eventId:', eventId);
    
    const { data: participants, error } = await supabase
      .from('message_participants')
      .select('id, event_id, user_id, joined_at, last_read_at')
      .eq('event_id', eventId);

    if (error) {
      console.error('❌ Error getting group chat participants:', error);
      return [];
    }

    // Get user info for each participant
    const transformedParticipants: GroupChatParticipant[] = await Promise.all(
      (participants || []).map(async (participant) => {
        const { data: user } = await supabase
          .from('profiles')
          .select('full_name, profile_image_url')
          .eq('id', participant.user_id)
          .single();

        return {
          id: participant.id,
          event_id: participant.event_id,
          user_id: participant.user_id,
          joined_at: participant.joined_at,
          last_read_at: participant.last_read_at,
          user_name: user?.full_name || 'Unknown',
          user_avatar: user?.profile_image_url
        };
      })
    );

    console.log('✅ Group chat participants fetched:', transformedParticipants.length);
    return transformedParticipants;
  } catch (error) {
    console.error('Error getting group chat participants:', error);
    return [];
  }
};

// Mark group chat messages as read
export const markGroupChatMessagesAsRead = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    console.log('📖 Marking group chat messages as read:', { eventId, userId });

    // Update last_read_at for the participant using OLD SYSTEM
    const { error: updateError } = await supabase
      .from('message_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating last_read_at:', updateError);
      return false;
    }

    console.log('✅ Group chat messages marked as read');
    
    // Dispatch event to refresh badge
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messageRead'));
    }
    
    return true;
  } catch (error) {
    console.error('Error marking group chat messages as read:', error);
    return false;
  }
};
