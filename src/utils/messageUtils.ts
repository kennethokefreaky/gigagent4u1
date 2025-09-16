import { supabase } from '@/lib/supabaseClient';

export interface Message {
  id: string;
  event_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar?: string;
  is_read?: boolean;
}

export interface MessageParticipant {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface EventConversation {
  event_id: string;
  event_title: string;
  promoter_name: string;
  promoter_id: string;
  last_message?: Message;
  unread_count: number;
  participants: MessageParticipant[];
}

// Get all conversations for a user
export const getUserConversations = async (userId: string): Promise<EventConversation[]> => {
  try {
    const { data: participants, error: participantsError } = await supabase
      .from('message_participants')
      .select(`
        event_id,
        last_read_at,
        posts!inner(
          id,
          title,
          promoter_id,
          profiles!posts_promoter_id_fkey(
            full_name,
            profile_image_url
          )
        )
      `)
      .eq('user_id', userId);

    if (participantsError) {
      console.error('Error fetching conversations:', participantsError);
      return [];
    }

    const conversations: EventConversation[] = [];

    for (const participant of participants || []) {
      const event = participant.posts;
      if (!event) continue;

      // Get the last message for this conversation
      const { data: lastMessage, error: messageError } = await supabase
        .from('messages')
        .select(`
          id,
          message_text,
          created_at,
          sender_id,
          profiles!messages_sender_id_fkey(
            full_name,
            profile_image_url
          )
        `)
        .eq('event_id', participant.event_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get unread message count
      const { count: unreadCount, error: unreadError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', participant.event_id)
        .gt('created_at', participant.last_read_at);

      // Get all participants
      const { data: allParticipants, error: participantsError2 } = await supabase
        .from('message_participants')
        .select(`
          user_id,
          joined_at,
          profiles!message_participants_user_id_fkey(
            full_name,
            profile_image_url
          )
        `)
        .eq('event_id', participant.event_id);

      conversations.push({
        event_id: participant.event_id,
        event_title: event.title,
        promoter_name: event.profiles?.full_name || 'Unknown',
        promoter_id: event.promoter_id,
        last_message: lastMessage ? {
          id: lastMessage.id,
          event_id: participant.event_id,
          sender_id: lastMessage.sender_id,
          message_text: lastMessage.message_text,
          created_at: lastMessage.created_at,
          updated_at: lastMessage.created_at,
          sender_name: lastMessage.profiles?.full_name || 'Unknown',
          sender_avatar: lastMessage.profiles?.profile_image_url
        } : undefined,
        unread_count: unreadCount || 0,
        participants: (allParticipants || []).map(p => ({
          id: p.user_id,
          event_id: participant.event_id,
          user_id: p.user_id,
          joined_at: p.joined_at,
          last_read_at: participant.last_read_at,
          user_name: p.profiles?.full_name || 'Unknown',
          user_avatar: p.profiles?.profile_image_url
        }))
      });
    }

    // Sort by last message time
    return conversations.sort((a, b) => {
      if (!a.last_message && !b.last_message) return 0;
      if (!a.last_message) return 1;
      if (!b.last_message) return -1;
      return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
    });

  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
};

// Get messages for a specific event conversation
export const getEventMessages = async (eventId: string, userId: string): Promise<Message[]> => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        event_id,
        sender_id,
        message_text,
        created_at,
        updated_at,
        profiles!messages_sender_id_fkey(
          full_name,
          profile_image_url
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    // Get read status for each message
    const { data: readStatus, error: readError } = await supabase
      .from('message_read_status')
      .select('message_id')
      .eq('user_id', userId);

    const readMessageIds = new Set((readStatus || []).map(r => r.message_id));

    return (messages || []).map(msg => ({
      id: msg.id,
      event_id: msg.event_id,
      sender_id: msg.sender_id,
      message_text: msg.message_text,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      sender_name: msg.profiles?.full_name || 'Unknown',
      sender_avatar: msg.profiles?.profile_image_url,
      is_read: readMessageIds.has(msg.id)
    }));

  } catch (error) {
    console.error('Error getting event messages:', error);
    return [];
  }
};

// Send a message
export const sendMessage = async (eventId: string, senderId: string, messageText: string): Promise<Message | null> => {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        event_id: eventId,
        sender_id: senderId,
        message_text: messageText
      })
      .select(`
        id,
        event_id,
        sender_id,
        message_text,
        created_at,
        updated_at,
        profiles!messages_sender_id_fkey(
          full_name,
          profile_image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return {
      id: message.id,
      event_id: message.event_id,
      sender_id: message.sender_id,
      message_text: message.message_text,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender_name: message.profiles?.full_name || 'Unknown',
      sender_avatar: message.profiles?.profile_image_url,
      is_read: false
    };

  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

// Join a conversation (add user as participant)
export const joinConversation = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('message_participants')
      .insert({
        event_id: eventId,
        user_id: userId
      });

    if (error) {
      console.error('Error joining conversation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error joining conversation:', error);
    return false;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    // Get all unread messages for this event
    const { data: unreadMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('event_id', eventId)
      .gt('created_at', (await supabase
        .from('message_participants')
        .select('last_read_at')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single()
      ).data?.last_read_at || '1970-01-01');

    if (messagesError) {
      console.error('Error getting unread messages:', messagesError);
      return false;
    }

    // Mark each message as read
    if (unreadMessages && unreadMessages.length > 0) {
      const readStatusInserts = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: userId
      }));

      const { error: readError } = await supabase
        .from('message_read_status')
        .upsert(readStatusInserts);

      if (readError) {
        console.error('Error marking messages as read:', readError);
        return false;
      }
    }

    // Update last_read_at for the participant
    const { error: updateError } = await supabase
      .from('message_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating last_read_at:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
};

// Get total unread message count for a user
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const { data: participants, error: participantsError } = await supabase
      .from('message_participants')
      .select('event_id, last_read_at')
      .eq('user_id', userId);

    if (participantsError || !participants) {
      return 0;
    }

    let totalUnread = 0;

    for (const participant of participants) {
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', participant.event_id)
        .gt('created_at', participant.last_read_at);

      if (!countError && count) {
        totalUnread += count;
      }
    }

    return totalUnread;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
};



