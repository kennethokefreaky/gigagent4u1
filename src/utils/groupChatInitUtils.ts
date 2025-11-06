import { supabase } from '@/lib/supabaseClient';

/**
 * Ensure a group chat is created for an event and the promoter is added
 * This should be called after event creation
 */
export const ensureGroupChatForEvent = async (eventId: string, promoterId: string): Promise<boolean> => {
  try {
    console.log('🔍 Ensuring group chat for event:', eventId, 'promoter:', promoterId);
    
    const conversationId = `group_${eventId}`;
    
    // Check if promoter is already a participant
    const { data: existingParticipant, error: checkError } = await supabase
      .from('unified_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', promoterId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing participation:', checkError);
      return false;
    }
    
    if (existingParticipant) {
      console.log('✅ Promoter already participates in group chat');
      return true;
    }
    
    // Add promoter to group chat
    const { error: insertError } = await supabase
      .from('unified_participants')
      .insert({
        conversation_id: conversationId,
        conversation_type: 'group',
        user_id: promoterId
      });
    
    if (insertError) {
      console.error('❌ Error adding promoter to group chat:', insertError);
      return false;
    }
    
    console.log('✅ Group chat created and promoter added successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error ensuring group chat for event:', error);
    return false;
  }
};

/**
 * Add a talent to a group chat when they apply to an event
 */
export const addTalentToGroupChat = async (eventId: string, talentId: string): Promise<boolean> => {
  try {
    console.log('🔍 Adding talent to group chat:', { eventId, talentId });
    
    const conversationId = `group_${eventId}`;
    
    // Check if talent is already a participant
    const { data: existingParticipant, error: checkError } = await supabase
      .from('unified_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', talentId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing participation:', checkError);
      return false;
    }
    
    if (existingParticipant) {
      console.log('✅ Talent already participates in group chat');
      return true;
    }
    
    // Get the promoter ID for this event
    const { data: eventData, error: eventError } = await supabase
      .from('posts')
      .select('promoter_id')
      .eq('id', eventId)
      .single();
    
    if (eventError || !eventData) {
      console.error('❌ Error getting event promoter:', eventError);
      return false;
    }
    
    const promoterId = eventData.promoter_id;
    
    // Add talent to group chat
    const { error: insertError } = await supabase
      .from('unified_participants')
      .insert({
        conversation_id: conversationId,
        conversation_type: 'group',
        user_id: talentId
      });
    
    if (insertError) {
      console.error('❌ Error adding talent to group chat:', insertError);
      return false;
    }
    
    // Add promoter to group chat if not already there
    const { data: promoterExists, error: promoterCheckError } = await supabase
      .from('unified_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', promoterId)
      .single();
    
    if (promoterCheckError && promoterCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking promoter participation:', promoterCheckError);
    }
    
    if (!promoterExists) {
      console.log('🔍 Adding promoter to group chat...');
      const { error: promoterError } = await supabase
        .from('unified_participants')
        .insert({
          conversation_id: conversationId,
          conversation_type: 'group',
          user_id: promoterId
        });
      
      if (promoterError) {
        console.error('❌ Error adding promoter to group chat:', promoterError);
      } else {
        console.log('✅ Promoter added to group chat successfully');
      }
    }
    
    console.log('✅ Talent added to group chat successfully');
    
    // Debug: Verify the talent was actually added
    const { data: verifyParticipant, error: verifyError } = await supabase
      .from('unified_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', talentId);
    
    console.log('🔍 DEBUG: Verification - talent participant record:', verifyParticipant);
    console.log('🔍 DEBUG: Verification error:', verifyError);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error adding talent to group chat:', error);
    return false;
  }
};

/**
 * Get all participants in a group chat for an event
 */
export const getGroupChatParticipants = async (eventId: string): Promise<Array<{
  user_id: string;
  user_name: string;
  user_email: string;
  joined_at: string;
}>> => {
  try {
    console.log('🔍 Getting group chat participants for event:', eventId);
    
    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('message_participants')
      .select('user_id, joined_at')
      .eq('event_id', eventId);
    
    if (participantsError) {
      console.error('❌ Error getting group chat participants:', participantsError);
      return [];
    }
    
    if (!participants || participants.length === 0) {
      console.log('✅ No participants found in group chat');
      return [];
    }
    
    // Get user details for each participant
    const participantsWithDetails = await Promise.all(
      participants.map(async (participant) => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', participant.user_id)
          .single();
        
        if (profileError) {
          console.error('❌ Error fetching profile for user:', participant.user_id, profileError);
          return {
            user_id: participant.user_id,
            user_name: 'Unknown',
            user_email: '',
            joined_at: participant.joined_at
          };
        }
        
        return {
          user_id: participant.user_id,
          user_name: profile.full_name || 'Unknown',
          user_email: profile.email || '',
          joined_at: participant.joined_at
        };
      })
    );
    
    console.log('✅ Group chat participants fetched:', participantsWithDetails.length);
    return participantsWithDetails;
    
  } catch (error) {
    console.error('❌ Error getting group chat participants:', error);
    return [];
  }
};

/**
 * Verify that a group chat exists and has the correct participants
 */
export const verifyGroupChat = async (eventId: string, expectedPromoterId: string): Promise<{
  exists: boolean;
  promoterParticipating: boolean;
  participantCount: number;
  participants: Array<{ user_id: string; user_name: string }>;
}> => {
  try {
    console.log('🔍 Verifying group chat for event:', eventId);
    
    // Get all participants
    const participants = await getGroupChatParticipants(eventId);
    
    const promoterParticipating = participants.some(p => p.user_id === expectedPromoterId);
    
    return {
      exists: participants.length > 0,
      promoterParticipating,
      participantCount: participants.length,
      participants: participants.map(p => ({
        user_id: p.user_id,
        user_name: p.user_name
      }))
    };
    
  } catch (error) {
    console.error('❌ Error verifying group chat:', error);
    return {
      exists: false,
      promoterParticipating: false,
      participantCount: 0,
      participants: []
    };
  }
};
