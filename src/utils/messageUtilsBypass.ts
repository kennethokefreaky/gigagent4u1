// Bypass function for development - uses service role to bypass RLS
// ⚠️ WARNING: This bypasses security - only use for development!

import { createClient } from '@supabase/supabase-js';

// Create a service role client (bypasses RLS)
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // You'll need to add this to your .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Bypass version of getUserConversations
export const getUserConversationsBypass = async (userId: string): Promise<any[]> => {
  try {
    console.log('🔍 BYPASS: Getting conversations for user:', userId);
    
    // Use service role to bypass RLS
    const { data: participants, error: participantsError } = await supabaseServiceRole
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

    console.log('🔍 BYPASS: Query result:', { participants, participantsError });

    if (participantsError) {
      console.error('❌ BYPASS: Error fetching conversations:', participantsError);
      return [];
    }

    if (!participants || participants.length === 0) {
      console.log('🔍 BYPASS: No conversations found for user:', userId);
      return [];
    }

    // Transform the data to match the expected format
    const conversations = participants.map(participant => ({
      event_id: participant.event_id,
      event_title: participant.posts?.title || 'Unknown Event',
      promoter_name: participant.posts?.profiles?.full_name || 'Unknown Promoter',
      promoter_avatar: participant.posts?.profiles?.profile_image_url,
      last_read_at: participant.last_read_at,
      last_message: null, // We'll add this later if needed
      unread_count: 0, // We'll add this later if needed
      participants: [] // We'll add this later if needed
    }));

    console.log('✅ BYPASS: Returning conversations:', conversations);
    return conversations;
  } catch (error) {
    console.error('❌ BYPASS: Exception in getUserConversationsBypass:', error);
    return [];
  }
};
