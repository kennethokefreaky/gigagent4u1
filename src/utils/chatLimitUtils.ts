import { supabase } from '@/lib/supabaseClient';

export interface ChatSubscription {
  id: string;
  user_id: string;
  subscription_type: 'free' | 'premium';
  subscription_status: 'active' | 'cancelled' | 'expired';
  free_chats_used: number;
  free_chats_limit: number;
  subscription_start_date?: string;
  subscription_end_date?: string;
  has_ever_subscribed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatUsage {
  id: string;
  talent_id: string;
  promoter_id: string;
  event_id?: string;
  first_message_sent_at: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get chat subscription for a user
 */
export const getChatSubscription = async (userId: string): Promise<ChatSubscription | null> => {
  try {
    const { data, error } = await supabase
      .from('chat_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no subscription found (PGRST116), create a default one
      if (error.code === 'PGRST116') {
        console.log('No chat subscription found, creating default one for user:', userId);
        
        const { data: newSubscription, error: insertError } = await supabase
          .from('chat_subscriptions')
          .insert({
            user_id: userId,
            subscription_type: 'free',
            subscription_status: 'active',
            free_chats_used: 0,
            free_chats_limit: 15,
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default chat subscription:', insertError);
          return null;
        }

        return newSubscription;
      } else {
        console.error('Error fetching chat subscription:', error.message || error);
        return null;
      }
    }

    return data;
  } catch (error) {
    console.error('Exception in getChatSubscription:', error);
    return null;
  }
};

/**
 * Check if user can send a chat message to a promoter
 */
export const canSendChatMessage = async (talentId: string, promoterId: string): Promise<{
  canSend: boolean;
  reason?: string;
  subscription?: ChatSubscription;
}> => {
  try {
    console.log('🔍 Checking if user can send chat message:', { talentId, promoterId });
    
    // Get user's chat subscription
    const subscription = await getChatSubscription(talentId);
    
    if (!subscription) {
      console.log('❌ No subscription found');
      return {
        canSend: false,
        reason: 'No subscription found. Please contact support.'
      };
    }

    console.log('📋 User subscription:', subscription);

    // Check if user has already chatted with this promoter
    const { data: existingChat, error: chatError } = await supabase
      .from('chat_usage')
      .select('*')
      .eq('talent_id', talentId)
      .eq('promoter_id', promoterId)
      .single();

    if (chatError && chatError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing chat:', chatError);
      return {
        canSend: false,
        reason: 'Error checking chat history. Please try again.'
      };
    }

    // If already chatted with this promoter, allow (regardless of subscription)
    if (existingChat) {
      console.log('✅ User has already chatted with this promoter, allowing access');
      return {
        canSend: true,
        subscription
      };
    }

    // Check if user has premium subscription
    if (subscription.subscription_type === 'premium' && subscription.subscription_status === 'active') {
      console.log('✅ User has premium subscription, allowing access');
      return {
        canSend: true,
        subscription
      };
    }

    // Check if user has reached free chat limit
    if (subscription.free_chats_used >= subscription.free_chats_limit) {
      console.log('❌ User has reached free chat limit');
      return {
        canSend: false,
        reason: 'You have reached your free chat limit. Please subscribe to continue chatting.',
        subscription
      };
    }

    console.log('✅ User can send free chat');
    return {
      canSend: true,
      subscription
    };
  } catch (error) {
    console.error('❌ Exception in canSendChatMessage:', error);
    return {
      canSend: false,
      reason: 'An error occurred. Please try again.'
    };
  }
};

/**
 * Record a new chat message being sent to a promoter
 */
export const recordChatMessage = async (
  talentId: string, 
  promoterId: string, 
  eventId?: string
): Promise<boolean> => {
  try {
    // Get the talent's subscription info first
    const { data: subscription, error: subscriptionError } = await supabase
      .from('chat_subscriptions')
      .select('*')
      .eq('user_id', talentId)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error getting subscription:', subscriptionError);
      return false;
    }

    // Check if this is the first message to this promoter
    const { data: existingChat, error: chatError } = await supabase
      .from('chat_usage')
      .select('*')
      .eq('talent_id', talentId)
      .eq('promoter_id', promoterId)
      .single();

    if (chatError && chatError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing chat:', chatError);
      return false;
    }

    // If this is the first message to this promoter, create new chat_usage record
    if (!existingChat) {
      const { error: insertError } = await supabase
        .from('chat_usage')
        .insert({
          talent_id: talentId,
          promoter_id: promoterId,
          event_id: eventId,
          first_message_sent_at: new Date().toISOString(),
          message_count: 1
        });

      if (insertError) {
        console.error('Error creating chat usage record:', insertError);
        return false;
      }

      // Update free chats used count (only if subscription exists)
      if (subscription) {
        const { error: updateError } = await supabase
          .from('chat_subscriptions')
          .update({ 
            free_chats_used: subscription.free_chats_used + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', talentId);

        if (updateError) {
          console.error('Error updating free chats used:', updateError);
          return false;
        }
      }
    } else {
      // Update existing chat usage record
      const { error: updateError } = await supabase
        .from('chat_usage')
        .update({ 
          message_count: existingChat.message_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('talent_id', talentId)
        .eq('promoter_id', promoterId);

      if (updateError) {
        console.error('Error updating chat usage:', updateError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Exception in recordChatMessage:', error);
    return false;
  }
};

/**
 * Get chat usage statistics for a user
 */
export const getChatUsageStats = async (talentId: string): Promise<{
  totalPromoters: number;
  freeChatsUsed: number;
  freeChatsRemaining: number;
  subscription: ChatSubscription | null;
}> => {
  try {
    const subscription = await getChatSubscription(talentId);
    
    if (!subscription) {
      return {
        totalPromoters: 0,
        freeChatsUsed: 0,
        freeChatsRemaining: 0,
        subscription: null
      };
    }

    // Get total number of unique promoters chatted with
    const { data: chatUsage, error: usageError } = await supabase
      .from('chat_usage')
      .select('promoter_id')
      .eq('talent_id', talentId);

    if (usageError) {
      console.error('Error fetching chat usage:', usageError);
      return {
        totalPromoters: 0,
        freeChatsUsed: subscription.free_chats_used,
        freeChatsRemaining: Math.max(0, subscription.free_chats_limit - subscription.free_chats_used),
        subscription
      };
    }

    return {
      totalPromoters: chatUsage?.length || 0,
      freeChatsUsed: subscription.free_chats_used,
      freeChatsRemaining: Math.max(0, subscription.free_chats_limit - subscription.free_chats_used),
      subscription
    };
  } catch (error) {
    console.error('Exception in getChatUsageStats:', error);
    return {
      totalPromoters: 0,
      freeChatsUsed: 0,
      freeChatsRemaining: 0,
      subscription: null
    };
  }
};

/**
 * Upgrade user to premium subscription
 */
export const upgradeToPremium = async (userId: string, promoterId?: string, eventId?: string): Promise<boolean> => {
  try {
    console.log('🔍 upgradeToPremium: Starting upgrade for user:', userId, 'with promoter:', promoterId);
    
    // First check if user has a chat subscription record
    const { data: existingSubscription, error: checkError } = await supabase
      .from('chat_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('🔍 upgradeToPremium: Existing subscription check:', { existingSubscription, checkError });

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ upgradeToPremium: Error checking existing subscription:', checkError);
      return false;
    }

    // If no subscription exists, create one first
    if (!existingSubscription) {
      console.log('🔍 upgradeToPremium: No existing subscription, creating new one');
      const { error: insertError } = await supabase
        .from('chat_subscriptions')
        .insert({
          user_id: userId,
          subscription_type: 'premium',
          subscription_status: 'active',
          has_ever_subscribed: true,
          free_chats_used: 0,
          free_chats_limit: 15,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ upgradeToPremium: Error creating new subscription:', insertError);
        console.error('❌ upgradeToPremium: Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        return false;
      }
      
      console.log('✅ upgradeToPremium: New subscription created successfully');
    } else {
      // Update existing subscription
      console.log('🔍 upgradeToPremium: Updating existing subscription');
      const { error } = await supabase
        .from('chat_subscriptions')
        .update({
          subscription_type: 'premium',
          subscription_status: 'active',
          has_ever_subscribed: true,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ upgradeToPremium: Error updating subscription:', error);
        console.error('❌ upgradeToPremium: Update error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return false;
      }

      console.log('✅ upgradeToPremium: Subscription updated successfully');
    }

    // Create private chat conversation if promoterId is provided
    if (promoterId) {
      console.log('🔍 upgradeToPremium: Creating private chat with promoter:', promoterId);
      
      // Check if private chat already exists
      const { data: existingPrivateChat, error: privateChatCheckError } = await supabase
        .from('message_participants')
        .select('*')
        .eq('user_id', userId)
        .eq('promoter_id', promoterId)
        .is('event_id', null)
        .single();

      if (privateChatCheckError && privateChatCheckError.code !== 'PGRST116') {
        console.error('❌ upgradeToPremium: Error checking existing private chat:', privateChatCheckError);
        return false;
      }

      if (!existingPrivateChat) {
        console.log('🔍 upgradeToPremium: Creating new private chat conversation');
        
        // Create private chat conversation (event_id = null for private chats)
        const { error: privateChatError } = await supabase
          .from('message_participants')
          .insert([
            {
              user_id: userId,
              promoter_id: promoterId,
              event_id: null, // null for private chats
              joined_at: new Date().toISOString()
            },
            {
              user_id: promoterId,
              promoter_id: promoterId,
              event_id: null, // null for private chats
              joined_at: new Date().toISOString()
            }
          ]);

        if (privateChatError) {
          console.error('❌ upgradeToPremium: Error creating private chat:', privateChatError);
          return false;
        }

        console.log('✅ upgradeToPremium: Private chat created successfully');
      } else {
        console.log('✅ upgradeToPremium: Private chat already exists');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ upgradeToPremium: Exception caught:', error);
    console.error('❌ upgradeToPremium: Exception details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return false;
  }
};
