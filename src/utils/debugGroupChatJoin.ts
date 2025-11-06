import { supabase } from '@/lib/supabaseClient';

// Debug function to test group chat joining
export const debugGroupChatJoin = async (userId: string) => {
  try {
    console.log('🔍 DEBUG: Starting group chat join debug for user:', userId);
    
    // 1. Check if user has any message_participants
    const { data: participants, error: participantsError } = await supabase
      .from('message_participants')
      .select('*')
      .eq('user_id', userId);
    
    console.log('🔍 DEBUG: User participants:', { participants, participantsError });
    
    // 2. Check if user has any notifications with event_id
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('event_id, promoter_id, type, button_text, message')
      .eq('user_id', userId)
      .eq('type', 'offer_received');
    
    console.log('🔍 DEBUG: User notifications:', { notifications, notificationsError });
    
    // 3. Check if there are any events in the system
    const { data: events, error: eventsError } = await supabase
      .from('posts')
      .select('id, title, promoter_id')
      .limit(5);
    
    console.log('🔍 DEBUG: Recent events:', { events, eventsError });
    
    // 4. Try to manually add user to a group chat if they have notifications
    if (notifications && notifications.length > 0) {
      const notification = notifications[0];
      if (notification.event_id) {
        console.log('🔍 DEBUG: Trying to manually add user to group chat for event:', notification.event_id);
        
        const { error: joinError } = await supabase
          .from('message_participants')
          .upsert({
            event_id: notification.event_id,
            user_id: userId,
            joined_at: new Date().toISOString(),
            last_read_at: new Date().toISOString()
          }, {
            onConflict: 'event_id,user_id'
          });
        
        console.log('🔍 DEBUG: Manual join result:', { joinError });
        
        if (!joinError) {
          // Check if it worked
          const { data: newParticipants } = await supabase
            .from('message_participants')
            .select('*')
            .eq('user_id', userId);
          
          console.log('🔍 DEBUG: New participants after manual join:', newParticipants);
        }
      }
    }
    
    return {
      participants,
      notifications,
      events,
      success: true
    };
  } catch (error) {
    console.error('❌ DEBUG: Error in debugGroupChatJoin:', error);
    return {
      participants: null,
      notifications: null,
      events: null,
      success: false,
      error
    };
  }
};
