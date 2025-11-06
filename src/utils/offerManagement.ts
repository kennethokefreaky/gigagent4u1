import { supabase } from '@/lib/supabaseClient';

export interface OfferNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  button_text: string;
  icon: string;
  show_confetti?: boolean;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const createOfferNotification = async (
  promoterId: string,
  talentId: string,
  amount: string,
  eventTitle: string,
  eventId?: string
): Promise<OfferNotification | null> => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('No authenticated user:', authError);
      return null;
    }

    // Get promoter's name
    const { data: promoterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', promoterId)
      .single();

    const promoterName = promoterProfile?.full_name || "A promoter";

    // Prepare notification data with proper columns for tracking
    const notificationData: any = {
      user_id: talentId,
      type: 'offer_received',
      title: 'New Offer Received',
      message: `${promoterName} is offering $${amount} to join the event "${eventTitle}". Do you accept?`,
      button_text: 'Accept Offer',
      icon: '💰',
      is_read: false,
      promoter_id: promoterId, // Store promoter ID in proper column
      event_id: eventId, // Store event ID in proper column
      event_title: eventTitle, // Store event title in proper column
      offer_amount: parseFloat(amount) // Store offer amount in proper column
    };


    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      // If metadata column doesn't exist, try without it
      if (error.code === '42703' && error.message.includes('metadata')) {
        console.log('Metadata column not found, creating notification without metadata');
        const fallbackData = { ...notificationData };
        delete fallbackData.metadata;
        
        const { data: fallbackResult, error: fallbackError } = await supabase
          .from('notifications')
          .insert(fallbackData)
          .select()
          .single();
          
        if (fallbackError) {
          console.error('Error creating offer notification (fallback):', fallbackError);
          return null;
        }
        
        return fallbackResult;
      }
      
      console.error('Error creating offer notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in createOfferNotification:', error);
    return null;
  }
};

export const hasOfferBeenSent = async (
  promoterId: string,
  talentId: string
): Promise<boolean> => {
  try {
    // Get promoter's name to check in the message
    const { data: promoterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', promoterId)
      .single();

    const promoterName = promoterProfile?.full_name || "A promoter";

    // Check if there's an unread offer notification for this talent from this promoter
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', talentId)
      .eq('type', 'offer_received')
      .eq('is_read', false)
      .ilike('message', `%${promoterName}%`);

    if (error) {
      console.error('Error checking if offer was sent:', error);
      return false;
    }

    return (data && data.length > 0) || false;
  } catch (error) {
    console.error('Error checking if offer was sent:', error);
    return false;
  }
};

export const hasOfferBeenSentForEvent = async (
  promoterId: string,
  talentId: string,
  eventId: string
): Promise<boolean> => {
  try {
    // First, try to check with metadata column (new approach)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, metadata')
        .eq('user_id', talentId)
        .eq('type', 'offer_received')
        .eq('is_read', false);

      if (error) {
        // If metadata column doesn't exist, fall back to old method
        if (error.code === '42703' && error.message.includes('metadata')) {
          console.log('Metadata column not found, falling back to legacy offer checking');
          return await hasOfferBeenSentLegacy(promoterId, talentId);
        }
        console.error('Error checking if offer was sent for event:', error);
        return false;
      }

      if (!data || data.length === 0) {
        return false;
      }

      // Check if any notification contains the specific event ID and promoter ID
      for (const notification of data) {
        if (notification.metadata) {
          try {
            const metadata = JSON.parse(notification.metadata);
            if (metadata.eventId === eventId && metadata.promoterId === promoterId) {
              return true;
            }
          } catch (parseError) {
            console.log('Error parsing notification metadata:', parseError);
          }
        }
      }

      return false;
    } catch (metadataError) {
      // Fallback to legacy method if metadata approach fails
      console.log('Metadata approach failed, using legacy method:', metadataError);
      return await hasOfferBeenSentLegacy(promoterId, talentId);
    }
  } catch (error) {
    console.error('Error checking if offer was sent for event:', error);
    return false;
  }
};

// New function to check if talent has already accepted an offer from this promoter
export const hasTalentAcceptedOfferFromPromoter = async (
  talentId: string,
  promoterId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('id')
      .eq('talent_id', talentId)
      .eq('promoter_id', promoterId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error checking if talent accepted offer:', error);
      return false;
    }

    return (data && data.length > 0) || false;
  } catch (error) {
    console.error('Error checking if talent accepted offer:', error);
    return false;
  }
};

// Legacy method for backward compatibility
const hasOfferBeenSentLegacy = async (
  promoterId: string,
  talentId: string
): Promise<boolean> => {
  try {
    // Get promoter's name to check in the message
    const { data: promoterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', promoterId)
      .single();

    const promoterName = promoterProfile?.full_name || "A promoter";

    // Check if there's an unread offer notification for this talent from this promoter
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', talentId)
      .eq('type', 'offer_received')
      .eq('is_read', false)
      .ilike('message', `%${promoterName}%`);

    if (error) {
      console.error('Error checking if offer was sent (legacy):', error);
      return false;
    }

    return (data && data.length > 0) || false;
  } catch (error) {
    console.error('Error checking if offer was sent (legacy):', error);
    return false;
  }
};

export const getOfferNotificationsByTalent = async (talentId: string): Promise<OfferNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', talentId)
      .eq('type', 'offer_received')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching offer notifications by talent:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching offer notifications by talent:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};
