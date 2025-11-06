import { supabase } from '@/lib/supabaseClient';
import { createCandidate } from './candidateUtils';

export interface OfferNotification {
  id: string;
  promoter_id: string;
  talent_id: string;
  amount: string;
  event_title?: string;
  status: 'pending' | 'accepted' | 'declined' | 'edited';
  created_at: string;
  updated_at: string;
}

export const handleOfferAcceptance = async (notificationId: string, talentId: string, promoterId: string, amount: string, eventId?: string, eventTitle?: string): Promise<boolean> => {
  try {
    // Create candidate record
    if (eventId && eventTitle) {
      try {
        const candidate = await createCandidate(talentId, promoterId, eventId, eventTitle, amount);
        if (!candidate) {
          console.error('❌ Failed to create candidate record');
          return false;
        }
        console.log('Candidate created successfully:', candidate);
      } catch (candidateError) {
        console.error('❌ Error creating candidate record:', candidateError);
        // Check if it's an RLS policy violation
        if (candidateError && candidateError.message && candidateError.message.includes('row-level security policy')) {
          console.log('❌ RLS policy violation - candidate may already exist or insufficient permissions');
          // Don't fail the entire process for RLS violations, continue with other steps
        } else {
          return false;
        }
      }
    }

    // Create group chat for the event if it doesn't exist
    if (eventId) {
      await createGroupChatForEvent(eventId, promoterId, talentId);
    }

    // Create acceptance notification for promoter
    const { error: promoterNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: promoterId,
        type: 'offer_accepted',
        title: 'Offer Accepted!',
        message: `Your offer of $${amount} has been accepted by the talent.`,
        button_text: 'View Details',
        icon: '✅',
        is_read: false
      });

    if (promoterNotificationError) {
      console.error('❌ Error creating promoter acceptance notification:', {
        error: promoterNotificationError,
        message: promoterNotificationError.message,
        details: promoterNotificationError.details,
        hint: promoterNotificationError.hint,
        code: promoterNotificationError.code
      });
      return false;
    }

    // Mark original notification as read and add acceptance status
    const { error: markReadError } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        button_text: 'Accepted',
        message: `You have accepted the offer of $${amount} to join the event${eventTitle ? ` "${eventTitle}"` : ''}.`
      })
      .eq('id', notificationId);

    if (markReadError) {
      console.error('Error marking notification as read:', markReadError);
      return false;
    }

    console.log('Offer acceptance handled successfully');
    return true;
  } catch (error) {
    console.error('Error handling offer acceptance:', error);
    return false;
  }
};

// Function to create group chat for an event
export const createGroupChatForEvent = async (eventId: string, promoterId: string, talentId: string) => {
  try {
    console.log('🔍 Creating group chat for event:', { eventId, promoterId, talentId });
    
    const conversationId = `group_${eventId}`;
    
    // Check if group chat already exists for this event
    const { data: existingParticipants, error: checkError } = await supabase
      .from('unified_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    console.log('🔍 Existing participants check:', { existingParticipants, checkError });

    if (checkError) {
      console.error('❌ Error checking existing participants:', {
        error: checkError,
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
        code: checkError.code
      });
      return;
    }

    // Add promoter to group chat if not already there
    const promoterExists = existingParticipants?.some(p => p.user_id === promoterId);
    console.log('🔍 Promoter exists check:', { promoterExists, promoterId });
    
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

    // Add talent to group chat if not already there
    const talentExists = existingParticipants?.some(p => p.user_id === talentId);
    console.log('🔍 Talent exists check:', { talentExists, talentId });
    
    if (!talentExists) {
      console.log('🔍 Adding talent to group chat...');
      const { error: talentError } = await supabase
        .from('unified_participants')
        .insert({
          conversation_id: conversationId,
          conversation_type: 'group',
          user_id: talentId
        });

      if (talentError) {
        console.error('❌ Error adding talent to group chat:', talentError);
      } else {
        console.log('✅ Talent added to group chat successfully');
      }
    }

    console.log('Group chat created/updated for event:', eventId);
  } catch (error) {
    console.error('Error creating group chat:', error);
  }
};

export const handleOfferEdit = async (notificationId: string, talentId: string, promoterId: string, newAmount: string) => {
  try {
    // Create edit notification for promoter
    const { error: promoterNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: promoterId,
        type: 'offer_edited',
        title: 'Offer Countered',
        message: `The talent has countered your offer with $${newAmount}.`,
        button_text: 'Review Counter',
        icon: '💰',
        is_read: false
      });

    if (promoterNotificationError) {
      console.error('Error creating promoter edit notification:', promoterNotificationError);
    }

    // Mark original notification as read
    const { error: markReadError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (markReadError) {
      console.error('Error marking notification as read:', markReadError);
    }

    console.log('Offer edit handled successfully');
  } catch (error) {
    console.error('Error handling offer edit:', error);
  }
};

export const createOfferNotification = async (talentId: string, promoterId: string, amount: string, eventTitle?: string, eventId?: string) => {
  try {
    console.log('🔍 Creating offer notification with data:', {
      talentId,
      promoterId,
      amount,
      eventTitle,
      eventId
    });

    // Get promoter's name for notification
    const { data: promoterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', promoterId)
      .single();

    const promoterName = promoterProfile?.full_name || "A promoter";

    // Validate required fields
    if (!promoterId || !eventId) {
      console.error('❌ Missing required fields for offer notification:', {
        promoterId,
        eventId,
        talentId,
        amount,
        eventTitle
      });
      return null;
    }

    // Create offer notification for talent
    const notificationData = {
      user_id: talentId,
      type: 'offer_received',
      title: 'New Offer Received',
      message: `${promoterName} is offering $${amount} to join the event${eventTitle ? ` "${eventTitle}"` : ''}. Do you accept?`,
      button_text: 'Accept Offer',
      icon: '💰',
      is_read: false,
      promoter_id: promoterId, // Store promoter ID
      event_id: eventId, // Store event ID
      event_title: eventTitle, // Store event title
      offer_amount: parseFloat(amount) // Store offer amount
    };

    console.log('🔍 Inserting notification data:', notificationData);

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating offer notification:', error);
      return null;
    }

    console.log('✅ Offer notification created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating offer notification:', error);
    return null;
  }
};
