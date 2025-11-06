import { supabase } from '@/lib/supabaseClient';

export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
}

// Get group chat participants for @ mention dropdown
// Only include talents who have accepted offers (are in candidates table with status = 'accepted')
export const getGroupChatParticipants = async (eventId: string): Promise<MentionUser[]> => {
  try {
    console.log('🔍 Getting group chat participants for event:', eventId);
    
    // Use the database function to get participants with profile info
    const { data: participants, error } = await supabase
      .rpc('get_group_chat_participants', { event_id_param: eventId });

    if (error) {
      console.error('Error fetching group chat participants:', error);
      // Fallback to direct query if RPC fails
      return await getGroupChatParticipantsFallback(eventId);
    }

    if (!participants || participants.length === 0) {
      console.log('✅ No group chat participants found');
      return [];
    }

    // Enrich RPC results with profile fallbacks to avoid 'Unknown' names
    const result = (await Promise.all(
      participants.map(async (participant: any) => {
        // If RPC already provided a usable name, use it; otherwise fetch profile
        const rpcName = (participant.full_name && participant.full_name.trim())
          || (participant.email && String(participant.email))
          || '';

        if (rpcName) {
          return {
            id: participant.user_id,
            name: rpcName,
            avatar: participant.profile_image_url
          } as MentionUser;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, profile_image_url')
          .eq('id', participant.user_id)
          .single();

        const fallbackName = (profile?.full_name && profile.full_name.trim())
          || (profile?.email ? profile.email : '')
          || 'Unknown';

        return {
          id: participant.user_id,
          name: fallbackName,
          avatar: profile?.profile_image_url
        } as MentionUser;
      })
    )) as MentionUser[];

    console.log('✅ Group chat participants fetched:', result.length);
    return result;

  } catch (error) {
    console.error('Error getting group chat participants:', error);
    return [];
  }
};

// Fallback method if RPC function is not available
const getGroupChatParticipantsFallback = async (eventId: string): Promise<MentionUser[]> => {
  try {
    console.log('🔄 Using fallback method to get participants');
    
    // First get all participants in the group chat
    const { data: participants, error: participantsError } = await supabase
      .from('message_participants')
      .select('user_id')
      .eq('event_id', eventId);

    if (participantsError) {
      console.error('Error fetching group chat participants (fallback):', participantsError);
      return [];
    }

    if (!participants || participants.length === 0) {
      return [];
    }

    // Get profile info for each participant separately to avoid foreign key issues
    const participantProfiles = await Promise.all(
      participants.map(async (participant) => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, username, email, profile_image_url')
          .eq('id', participant.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile for participant:', participant.user_id, profileError);
          return null;
        }

        return {
          id: participant.user_id,
          name: (profile?.full_name && profile.full_name.trim())
            || (profile?.username && profile.username.trim())
            || (profile?.email && profile.email.split('@')[0])
            || (profile?.email ? profile.email.split('@')[0] : '')
            || 'Unknown',
          avatar: profile?.profile_image_url
        };
      })
    );

    // Filter out null values and return
    return participantProfiles.filter(profile => profile !== null) as MentionUser[];

  } catch (error) {
    console.error('Error in fallback method:', error);
    return [];
  }
};

// Parse message for @ mentions
export const parseMentions = (message: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(message)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

// Create mention notifications
export const createMentionNotifications = async (
  eventId: string,
  message: string,
  senderId: string,
  senderName: string
): Promise<void> => {
  try {
    const mentions = parseMentions(message);
    if (mentions.length === 0) return;

    // Get all participants to match mentions
    const participants = await getGroupChatParticipants(eventId);
    
    // Get event title
    const { data: event } = await supabase
      .from('posts')
      .select('title')
      .eq('id', eventId)
      .single();

    const eventTitle = event?.title || 'Event';

    // Create notifications for mentioned users
    const mentionedUsers = participants
      // Match by name
      .filter(participant => 
        mentions.some(mention => 
          participant.name.toLowerCase().includes(mention.toLowerCase())
        )
      )
      // Do not notify the sender about their own mention
      .filter(user => user.id !== senderId);

    if (mentionedUsers.length > 0) {
      const notifications = mentionedUsers.map(user => ({
        user_id: user.id,
        type: 'new_message',
        title: 'You were mentioned',
        message: `${senderName} mentioned you in ${eventTitle}`,
        button_text: 'View Message',
        icon: '🔔',
        is_read: false,
        data: {
          event_id: eventId,
          sender_id: senderId,
          message_type: 'group',
          mention: true
        }
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating mention notifications:', error);
      } else {
        console.log('✅ Mention notifications created for', mentionedUsers.length, 'users');
        window.dispatchEvent(new CustomEvent('notificationCreated'));
      }
    }
  } catch (error) {
    console.error('Error creating mention notifications:', error);
  }
};
