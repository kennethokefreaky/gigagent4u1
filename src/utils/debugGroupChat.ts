// Debug function to check group chat creation and message access
import { supabase } from '@/lib/supabaseClient';

export const debugGroupChatFlow = async (userId: string) => {
  try {
    console.log('🔍 DEBUG: Starting group chat flow debug for user:', userId);
    
    // Step 1: Check if user exists in auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 DEBUG - Auth user:', { user: user?.id, authError });
    
    // Step 2: Check if user has any message_participants records
    const { data: userParticipants, error: participantsError } = await supabase
      .from('message_participants')
      .select('*')
      .eq('user_id', userId);
    
    console.log('🔍 DEBUG - User participants:', { 
      count: userParticipants?.length || 0, 
      participants: userParticipants,
      error: participantsError 
    });
    
    // Step 3: Check if user has any candidates records
    const { data: userCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('talent_id', userId);
    
    console.log('🔍 DEBUG - User candidates:', { 
      count: userCandidates?.length || 0, 
      candidates: userCandidates,
      error: candidatesError 
    });
    
    // Step 4: Check all message_participants (should work if RLS is disabled)
    const { data: allParticipants, error: allParticipantsError } = await supabase
      .from('message_participants')
      .select('*');
    
    console.log('🔍 DEBUG - All participants:', { 
      count: allParticipants?.length || 0, 
      error: allParticipantsError 
    });
    
    // Step 5: Check all candidates
    const { data: allCandidates, error: allCandidatesError } = await supabase
      .from('candidates')
      .select('*');
    
    console.log('🔍 DEBUG - All candidates:', { 
      count: allCandidates?.length || 0, 
      error: allCandidatesError 
    });
    
    // Step 6: Check if user has any notifications
    const { data: userNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    
    console.log('🔍 DEBUG - User notifications:', { 
      count: userNotifications?.length || 0, 
      notifications: userNotifications,
      error: notificationsError 
    });
    
    return {
      user,
      userParticipants,
      userCandidates,
      allParticipants,
      allCandidates,
      userNotifications,
      errors: {
        authError,
        participantsError,
        candidatesError,
        allParticipantsError,
        allCandidatesError,
        notificationsError
      }
    };
    
  } catch (error) {
    console.error('❌ DEBUG: Exception in debugGroupChatFlow:', error);
    return { error };
  }
};
