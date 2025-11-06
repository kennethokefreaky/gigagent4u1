"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MessageBadgeContextType {
  unreadMessageCount: number;
  refreshBadgeCount: () => Promise<void>;
  shouldShowBadge: boolean;
}

const MessageBadgeContext = createContext<MessageBadgeContextType | undefined>(undefined);

export function MessageBadgeProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [shouldShowBadge, setShouldShowBadge] = useState(true);

  // Calculate total unread messages (private + group)
  const refreshBadgeCount = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log("No authenticated user for message badge - skipping");
        setUnreadMessageCount(0);
        return;
      }

      // Get unread messages from UNIFIED SYSTEM
      const { data: participants, error: participantsError } = await supabase
        .from('unified_participants')
        .select('conversation_id, conversation_type, last_read_at')
        .eq('user_id', user.id);

      if (participantsError) {
        console.error('Error fetching unified participants:', participantsError);
      }

      let totalUnreadCount = 0;
      if (participants && participants.length > 0) {
        console.log('🔍 DEBUG: Found participants:', participants.length);
        for (const participant of participants) {
          console.log('🔍 DEBUG: Processing participant:', {
            conversationId: participant.conversation_id,
            conversationType: participant.conversation_type,
            lastReadAt: participant.last_read_at
          });
          
          // Only count messages that are unread AND not sent by the current user
          const { count } = await supabase
            .from('unified_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', participant.conversation_id)
            .neq('sender_id', user.id) // Don't count messages sent by current user
            .gt('created_at', participant.last_read_at || '1970-01-01');
          
          console.log('🔍 DEBUG: Unread count for conversation:', {
            conversationId: participant.conversation_id,
            conversationType: participant.conversation_type,
            unreadCount: count || 0,
            lastReadAt: participant.last_read_at
          });
          
          totalUnreadCount += count || 0;
        }
      }

      // Only set badge count if there are actually unread messages
      if (totalUnreadCount > 0) {
        setUnreadMessageCount(totalUnreadCount);
        console.log('📊 Message badge count updated:', {
          total: totalUnreadCount
        });
        console.log('🔍 DEBUG: Setting unreadMessageCount to:', totalUnreadCount);
      } else {
        setUnreadMessageCount(0);
        console.log('💬 No unread messages - badge count set to 0');
        console.log('🔍 DEBUG: Setting unreadMessageCount to: 0');
      }

    } catch (error) {
      console.error('Error refreshing message badge count:', error);
      setUnreadMessageCount(0);
    }
  }, []);

  // Initialize badge count
  useEffect(() => {
    refreshBadgeCount();
  }, [refreshBadgeCount]);

  // Listen for message events to refresh badge
  useEffect(() => {
    const handleMessageEvent = () => {
      // Only refresh badge if not on Messages page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/messages')) {
        refreshBadgeCount();
      }
    };

    const handleMessageRead = () => {
      // Refresh badge when messages are marked as read
      refreshBadgeCount();
    };

    window.addEventListener('messageSent', handleMessageEvent);
    window.addEventListener('notificationCreated', handleMessageEvent);
    window.addEventListener('messageRead', handleMessageRead);
    window.addEventListener('unifiedMessageSent', handleMessageEvent);

    return () => {
      window.removeEventListener('messageSent', handleMessageEvent);
      window.removeEventListener('notificationCreated', handleMessageEvent);
      window.removeEventListener('messageRead', handleMessageRead);
      window.removeEventListener('unifiedMessageSent', handleMessageEvent);
    };
  }, [refreshBadgeCount]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshBadgeCount();
    });

    return () => subscription.unsubscribe();
  }, [refreshBadgeCount]);

  // Periodic refresh to ensure badges are up to date
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBadgeCount();
    }, 10000); // Refresh every 10 seconds for faster updates

    return () => clearInterval(interval);
  }, [refreshBadgeCount]);

  // Force refresh on page load
  useEffect(() => {
    refreshBadgeCount();
  }, [refreshBadgeCount]);

  // Check if we're on the Messages page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMessagesPage = window.location.pathname.includes('/messages');
      setShouldShowBadge(!isMessagesPage);
    }
  }, []);

  return (
    <MessageBadgeContext.Provider value={{
      unreadMessageCount: shouldShowBadge ? unreadMessageCount : 0,
      refreshBadgeCount,
      shouldShowBadge
    }}>
      {children}
    </MessageBadgeContext.Provider>
  );
}

export function useMessageBadge() {
  const context = useContext(MessageBadgeContext);
  if (context === undefined) {
    throw new Error('useMessageBadge must be used within a MessageBadgeProvider');
  }
  return context;
}
