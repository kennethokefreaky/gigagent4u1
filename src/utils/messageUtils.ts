import { supabase } from '@/lib/supabaseClient';

// Emergency function to test if RLS is the issue
export const testMessageAccess = async (userId: string) => {
  try {
    console.log('🔍 EMERGENCY TEST: Checking message_participants access for user:', userId);
    
    // Test 1: Basic select
    const { data: basicData, error: basicError } = await supabase
      .from('message_participants')
      .select('*')
      .eq('user_id', userId);
    
    console.log('🔍 EMERGENCY TEST - Basic select:', { basicData, basicError });
    
    // Test 2: Check if user exists in auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 EMERGENCY TEST - Auth user:', { user: user?.id, authError });
    
    // Test 3: Check if user has any participants at all
    const { data: allParticipants, error: allError } = await supabase
      .from('message_participants')
      .select('*');
    
    console.log('🔍 EMERGENCY TEST - All participants:', { 
      count: allParticipants?.length || 0, 
      allError 
    });
    
    return { basicData, basicError, user, authError, allParticipants, allError };
  } catch (error) {
    console.error('❌ EMERGENCY TEST ERROR:', error);
    return { error };
  }
};
import { recordChatMessage } from './chatLimitUtils';

// Debug function to test Supabase connection and table access
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Test 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth test:', { user: user?.id, authError });
    
    // Test 2: Check if messages table exists and is accessible
    const { data: messagesTest, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
    console.log('Messages table test:', { messagesTest, messagesError });
    
    // Test 3: Check if message_participants table exists and is accessible
    const { data: participantsTest, error: participantsError } = await supabase
      .from('message_participants')
      .select('id')
      .limit(1);
    console.log('Message participants table test:', { participantsTest, participantsError });
    
    // Test 4: Check if posts table exists and is accessible
    const { data: postsTest, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .limit(1);
    console.log('Posts table test:', { postsTest, postsError });
    
    return {
      auth: { user: user?.id, error: authError },
      messages: { data: messagesTest, error: messagesError },
      participants: { data: participantsTest, error: participantsError },
      posts: { data: postsTest, error: postsError }
    };
  } catch (error) {
    console.error('❌ Test connection error:', error);
    return { error };
  }
};

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
  conversation_title: string;
  conversation_type: 'group' | 'private';
  promoter_name: string;
  promoter_id: string;
  last_message?: Message;
  unread_count: number;
  participants: MessageParticipant[];
}

// Get all conversations for a user
export const getUserConversations = async (userId: string): Promise<EventConversation[]> => {
  try {
    console.log('🔍 Getting conversations for user:', userId);
    
    // First, let's try a simple query to see if we can access message_participants at all
    console.log('🔍 Testing basic message_participants access...');
    const { data: testData, error: testError } = await supabase
      .from('message_participants')
      .select('*')
      .eq('user_id', userId)
      .limit(5);
    
    console.log('🔍 Basic test result:', { testData, testError });
    
          // Now try the full query with correct Supabase syntax
          console.log('🔍 Attempting full query with joins for user:', userId);
          const { data: participants, error: participantsError } = await supabase
            .from('message_participants')
            .select(`
              event_id,
              last_read_at,
              posts!inner(
                id,
                title,
                promoter_id
              )
            `)
            .eq('user_id', userId);

          console.log('🔍 Full query result:', { 
            participants, 
            participantsError,
            dataLength: participants?.length || 0,
            errorMessage: participantsError?.message,
            errorCode: participantsError?.code
          });

    if (participantsError) {
      console.error('❌ Error fetching conversations:', {
        error: participantsError,
        message: participantsError.message,
        details: participantsError.details,
        hint: participantsError.hint,
        code: participantsError.code
      });
      return [];
    }

    // --- NEW LOGGING ADDED HERE ---
    console.log('🔍 Supabase query result for message_participants:', { 
      data: participants, 
      error: participantsError,
      dataLength: participants?.length || 0,
      userId: userId
    });
    // --- END NEW LOGGING ---

    console.log('✅ Found participants:', participants?.length || 0);

    const conversations: EventConversation[] = [];

    for (const participant of participants || []) {
      const event = participant.posts;
      if (!event) continue;

      // Get the last message for this conversation (simplified to avoid 400 error)
      const { data: lastMessage, error: messageError } = await supabase
        .from('messages')
        .select(`
          id,
          message_text,
          created_at,
          sender_id
        `)
        .eq('event_id', participant.event_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle empty results

      if (messageError) {
        console.error('❌ Error fetching last message:', {
          error: messageError,
          message: messageError.message,
          details: messageError.details,
          hint: messageError.hint,
          code: messageError.code,
          eventId: participant.event_id
        });
      }

      // Get unread message count
      const { count: unreadCount, error: unreadError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', participant.event_id)
        .gt('created_at', participant.last_read_at);

      // Get all participants (simplified to avoid foreign key issues)
      const { data: allParticipants, error: participantsError2 } = await supabase
        .from('message_participants')
        .select(`
          user_id,
          joined_at
        `)
        .eq('event_id', participant.event_id);

      console.log('🔍 All participants query result:', { 
        allParticipants, 
        participantsError2,
        participantCount: allParticipants?.length || 0,
        eventId: participant.event_id
      });

      // Determine conversation type and title
      // Group chat: message_participants with event_id (promoter + talents for event)
      // Private chat: message_participants without event_id (direct promoter-talent chat)
      const participantCount = (allParticipants || []).length;
      const isGroupChat = !!participant.event_id; // If event_id exists, it's a group chat
      
      let conversationTitle: string;
      if (isGroupChat) {
        conversationTitle = event.title; // Group chat uses event title
      } else {
        // For private chats, we need to get the promoter's name from the promoter_id
        const { data: promoterProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', participant.promoter_id)
          .single();
        conversationTitle = promoterProfile?.full_name || 'Unknown Promoter';
      }
      
      const conversationType = isGroupChat ? 'group' : 'private';
      
      console.log('🔍 Conversation type detection:', {
        eventTitle: event.title,
        participantCount,
        isGroupChat,
        conversationTitle,
        conversationType
      });

      // Get promoter name separately
      let promoterName = 'Unknown';
      if (event.promoter_id) {
        const { data: promoterProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', event.promoter_id)
          .single();
        
        if (promoterProfile) {
          promoterName = promoterProfile.full_name || (promoterProfile.email ? promoterProfile.email.split('@')[0] : 'Unknown');
        }
      }

      conversations.push({
        event_id: participant.event_id,
        event_title: event.title,
        conversation_title: conversationTitle,
        conversation_type: conversationType,
        promoter_name: promoterName,
        promoter_id: event.promoter_id,
        last_message: lastMessage ? {
          id: lastMessage.id,
          event_id: participant.event_id,
          sender_id: lastMessage.sender_id,
          message_text: lastMessage.message_text,
          created_at: lastMessage.created_at,
          updated_at: lastMessage.created_at,
          sender_name: 'Unknown', // This will be updated below
          sender_avatar: null
        } : undefined,
        unread_count: unreadCount || 0,
        participants: (allParticipants || []).map(p => ({
          id: p.user_id,
          event_id: participant.event_id,
          user_id: p.user_id,
          joined_at: p.joined_at,
          last_read_at: participant.last_read_at,
          user_name: 'Unknown', // We'll fix this later
          user_avatar: null
        }))
      });
    }

    // Fetch sender names for last messages
    console.log('🔍 Fetching sender names for last messages...');
    for (const conversation of conversations) {
      if (conversation.last_message) {
        try {
          // Check if the current user is the sender
          if (conversation.last_message.sender_id === userId) {
            // Current user sent the message - show "You"
            conversation.last_message.sender_name = 'You';
            conversation.last_message.sender_avatar = null; // No need to fetch avatar for "You"
            console.log('✅ Message sent by current user - showing "You"');
          } else {
            // Someone else sent the message - fetch their profile
            const { data: senderProfile, error: senderError } = await supabase
              .from('profiles')
              .select('full_name, profile_image_url')
              .eq('id', conversation.last_message.sender_id)
              .single();

            if (!senderError && senderProfile) {
              // Use full name, or email as fallback, or "Unknown" as last resort
              let displayName = 'Unknown';
              if (senderProfile.full_name) {
                displayName = senderProfile.full_name;
              } else {
                // Try to get email as fallback
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user?.email) {
                  displayName = userData.user.email.split('@')[0];
                }
              }
              
              conversation.last_message.sender_name = displayName;
              conversation.last_message.sender_avatar = senderProfile.profile_image_url;
              console.log('✅ Updated sender name for other user:', displayName);
            } else {
              console.error('❌ Error fetching sender profile:', senderError);
              conversation.last_message.sender_name = 'Unknown';
            }
          }
        } catch (error) {
          console.error('❌ Error fetching sender name:', error);
          conversation.last_message.sender_name = 'Unknown';
        }
      }
    }

    // Sort by last message time
    return conversations.sort((a, b) => {
      if (!a.last_message && !b.last_message) return 0;
      if (!a.last_message) return 1;
      if (!b.last_message) return -1;
      return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
    });

  } catch (error) {
    console.error('❌ Exception in getUserConversations:', {
      error,
      userId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
};

// Get messages for a specific event conversation
export const getEventMessages = async (eventId: string, userId: string): Promise<Message[]> => {
  try {
    console.log('🔍 Fetching messages for eventId:', eventId, 'userId:', userId);
    
    // First, get the messages without the foreign key join
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        event_id,
        sender_id,
        message_text,
        created_at,
        updated_at
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching messages:', error);
      console.error('❌ Messages error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    console.log('✅ Messages fetched successfully:', messages?.length || 0, 'messages');

    // Get sender info for each unique sender
    const uniqueSenders = [...new Set(messages?.map(m => m.sender_id) || [])];
    const senderInfo: { [key: string]: { full_name: string; profile_image_url?: string } } = {};

    for (const senderId of uniqueSenders) {
      const { data: sender, error: senderError } = await supabase
        .from('profiles')
        .select('full_name, profile_image_url')
        .eq('id', senderId)
        .single();

      if (!senderError && sender) {
        senderInfo[senderId] = sender;
        console.log('✅ Sender info fetched for:', senderId, sender.full_name);
      } else {
        console.error('❌ Error fetching sender info for:', senderId, senderError);
        senderInfo[senderId] = { full_name: 'Unknown' };
      }
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
      sender_name: senderInfo[msg.sender_id]?.full_name || 'Unknown',
      sender_avatar: senderInfo[msg.sender_id]?.profile_image_url,
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
    console.log('🚀 Sending message:', { eventId, senderId, messageText: messageText.substring(0, 50) + '...' });
    
    // Validate inputs
    if (!eventId || !senderId || !messageText) {
      console.error('❌ Missing required parameters:', { eventId, senderId, messageText: !!messageText });
      return null;
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ User not authenticated:', authError);
      return null;
    }
    console.log('✅ User authenticated:', user.id);

    // First, ensure the user is a participant in the conversation
    console.log('🔄 Adding user as participant...');
    const { error: participantError } = await supabase
      .from('message_participants')
      .upsert({
        event_id: eventId,
        user_id: senderId
      }, { onConflict: 'event_id,user_id' });

    if (participantError) {
      console.error('❌ Error adding user as participant:', {
        code: participantError.code,
        message: participantError.message,
        details: participantError.details,
        hint: participantError.hint,
        fullError: participantError
      });
      return null;
    }

    console.log('✅ User added as participant');
    
    // Now insert the message
    console.log('🔄 Inserting message...');
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
        updated_at
      `)
      .single();

    if (error) {
      console.error('❌ Error sending message:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error,
        errorType: typeof error,
        errorKeys: Object.keys(error || {}),
        errorString: JSON.stringify(error, null, 2)
      });
      return null;
    }

    console.log('✅ Message inserted successfully:', message);

    // Track chat usage for talent users and create notifications
    try {
      // Get sender's role to determine if they're a talent
      const { data: senderProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', senderId)
        .single();

      if (!profileError && senderProfile?.role === 'talent') {
        // Get the promoter ID from the event
        const { data: eventData, error: eventError } = await supabase
          .from('posts')
          .select('promoter_id, title')
          .eq('id', eventId)
          .single();

        if (!eventError && eventData?.promoter_id) {
          // Record the chat message for tracking
          await recordChatMessage(senderId, eventData.promoter_id, eventId);

          // Create notification for the promoter about new message
          const senderName = senderProfile.full_name || 'A talent';
          const eventTitle = eventData.title || 'your event';
          
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: eventData.promoter_id,
              type: 'new_message',
              title: 'New Message',
              message: `${senderName} sent you a message about "${eventTitle}"`,
              button_text: 'View Message',
              icon: '💬',
              is_read: false
            });

          if (notificationError) {
            console.error('Error creating message notification:', notificationError);
          } else {
            console.log('✅ Message notification created for promoter');
            // Trigger notification refresh
            window.dispatchEvent(new CustomEvent('notificationCreated'));
          }
        }
      }
    } catch (trackingError) {
      console.error('Error tracking chat usage or creating notification:', trackingError);
      // Don't fail the message send if tracking fails
    }

    // Get sender info separately
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('full_name, profile_image_url')
      .eq('id', senderId)
      .single();

    if (senderError) {
      console.error('❌ Error fetching sender profile:', senderError);
    }

    return {
      id: message.id,
      event_id: message.event_id,
      sender_id: message.sender_id,
      message_text: message.message_text,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender_name: senderProfile?.full_name || 'Unknown',
      sender_avatar: senderProfile?.profile_image_url,
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
    console.log('🔄 Marking messages as read for event:', eventId, 'user:', userId);
    
    // First, get the participant's last_read_at
    const { data: participant, error: participantError } = await supabase
      .from('message_participants')
      .select('last_read_at')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (participantError && participantError.code !== 'PGRST116') {
      console.error('❌ Error getting participant data:', participantError);
      return false;
    }

    const lastReadAt = participant?.last_read_at || '1970-01-01';
    console.log('📅 Last read at:', lastReadAt);

    // Get all unread messages for this event
    const { data: unreadMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('event_id', eventId)
      .gt('created_at', lastReadAt);

    if (messagesError) {
      console.error('❌ Error getting unread messages:', messagesError);
      return false;
    }

    console.log('📨 Found', unreadMessages?.length || 0, 'unread messages');

    // Mark each message as read
    if (unreadMessages && unreadMessages.length > 0) {
      const readStatusInserts = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: userId
      }));

      const { error: readError } = await supabase
        .from('message_read_status')
        .upsert(readStatusInserts, {
          on_conflict: 'message_id,user_id'
        });

      if (readError) {
        console.error('❌ Error marking messages as read:', readError);
        return false;
      }
      console.log('✅ Marked', unreadMessages.length, 'messages as read');
    }

    // Update last_read_at for the participant
    const { error: updateError } = await supabase
      .from('message_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating last_read_at:', updateError);
      return false;
    }

    console.log('✅ Successfully marked messages as read');
    return true;
  } catch (error) {
    console.error('❌ Exception in markMessagesAsRead:', error);
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



