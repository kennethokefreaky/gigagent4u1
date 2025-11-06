"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserConversations as getUnifiedConversations } from "@/utils/unifiedMessagingUtils";
import { supabase } from "@/lib/supabaseClient";
import { canSendChatMessage } from "@/utils/chatLimitUtils";
import { joinConversation, EventConversation } from "@/utils/messageUtils";

export default function MessagesPage() {
  const router = useRouter();
  const [privateChats, setPrivateChats] = useState<any[]>([]);
  const [groupChats, setGroupChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load conversations function
  const loadConversations = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting user:', authError);
        setLoading(false);
        return;
      }

        setCurrentUserId(user.id);

        // Load unified conversations
        console.log('🔍 Loading unified conversations for user:', user.id);

        // Check if user came from eventdetail with event selection
        const selectedEventData = sessionStorage.getItem('selectedEventForChat');
        if (selectedEventData) {
          try {
            const eventData = JSON.parse(selectedEventData);
            
            // Get user's role to check if they're a talent
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            // If user is a talent, check chat limits
            if (!profileError && profile?.role === 'talent') {
              const chatCheck = await canSendChatMessage(user.id, eventData.promoterId);
              
              if (!chatCheck.canSend) {
                // Check if this is a new conversation or existing one
                const { data: existingChat, error: chatError } = await supabase
                  .from('chat_usage')
                  .select('*')
                  .eq('talent_id', user.id)
                  .eq('promoter_id', eventData.promoterId)
                  .single();

                // If it's a new conversation (no existing chat), redirect to subscription
                if (chatError && chatError.code === 'PGRST116') { // PGRST116 = no rows returned
                  const params = new URLSearchParams({
                    promoterId: eventData.promoterId,
                    eventId: eventData.eventId,
                    eventTitle: eventData.eventTitle
                  });
                  sessionStorage.removeItem('selectedEventForChat');
                  router.push(`/chatsubscription?${params.toString()}`);
                  return;
                }
                // If it's an existing conversation, allow access
              }
            }
            
            // Join the conversation for this event
            await joinConversation(eventData.eventId, user.id);
            // Clear the session storage
            sessionStorage.removeItem('selectedEventForChat');
          } catch (error) {
            console.error('Error joining conversation:', error);
          }
        }

        // Load unified conversations
        console.log('🔍 Loading unified conversations for user:', user.id);
        const unifiedConversations = await getUnifiedConversations(user.id);
        console.log('🔍 Loaded unified conversations:', unifiedConversations.length, unifiedConversations);
        
        // Separate private and group conversations
        const privateConversations = unifiedConversations.filter(conv => conv.conversation_type === 'private');
        const groupConversations = unifiedConversations.filter(conv => conv.conversation_type === 'group');
        
        console.log('🔍 DEBUG: Private conversations:', privateConversations);
        console.log('🔍 DEBUG: Group conversations:', groupConversations);
        console.log('🔍 DEBUG: All unified conversations:', unifiedConversations);
        
        // Debug private conversation names specifically
        privateConversations.forEach((conv, index) => {
          console.log(`🔍 DEBUG: Private conversation ${index}:`, {
            conversation_id: conv.conversation_id,
            other_user_name: conv.other_user_name,
            other_user_id: conv.other_user_id,
            other_user_email: conv.other_user_email,
            last_message: conv.last_message
          });
        });
        
        // Additional debugging: Check if user has any participants records
        const { data: debugParticipants, error: debugError } = await supabase
          .from('unified_participants')
          .select('*')
          .eq('user_id', user.id);
        
        console.log('🔍 DEBUG: All participant records for user:', debugParticipants);
        console.log('🔍 DEBUG: Participant records error:', debugError);
        
        setPrivateChats(privateConversations);
        setGroupChats(groupConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

  // Load conversations on mount and handle event selection from eventdetail
  useEffect(() => {
    loadConversations();
  }, []);


  // Listen for message read events to refresh badges
  useEffect(() => {
    const handleMessageRead = () => {
      console.log('🔄 Message read event received, refreshing conversations');
      loadConversations();
    };

    const handleGroupChatRemoved = (event: any) => {
      console.log('🗑️ Group chat removed event received:', event.detail);
      // Show notification about group chat removal
      const { eventTitle, message } = event.detail;
      alert(`${eventTitle} group chat has been removed. ${message}`);
      // Refresh conversations to remove the group chat from the list
      loadConversations();
    };

    window.addEventListener('messageRead', handleMessageRead);
    window.addEventListener('groupChatRemoved', handleGroupChatRemoved);
    
    return () => {
      window.removeEventListener('messageRead', handleMessageRead);
      window.removeEventListener('groupChatRemoved', handleGroupChatRemoved);
    };
  }, []);

  const handleConversationClick = (conversationId: string, conversationType: string) => {
    if (conversationType === 'private') {
      console.log('🔍 Opening private chat:', conversationId);
      router.push(`/messages/${conversationId}/openmessage`);
    } else {
      // For group chats, strip the 'group_' prefix to get the eventId
      const eventId = conversationId.replace('group_', '');
      console.log('🔍 Opening group chat:', conversationId, '-> eventId:', eventId);
      router.push(`/messages/${eventId}/groupchat`);
    }
  };


  const handleBack = () => {
    router.push("/gigagent4u");
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const renderConversationRow = (conversation: any) => (
    <div
      key={conversation.conversation_id}
      onClick={() => handleConversationClick(conversation.conversation_id, conversation.conversation_type)}
      className="flex items-center space-x-3 p-4 hover:bg-input-background cursor-pointer transition-colors border-b border-text-secondary"
    >
      {/* Conversation Avatar */}
      <div className="relative">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
          conversation.conversation_type === 'group' ? 'bg-button-red' : 'bg-blue-500'
        }`}>
          {conversation.conversation_type === 'group' 
            ? (conversation.event_title || 'Group').charAt(0).toUpperCase()
            : (conversation.other_user_name || 'User').charAt(0).toUpperCase()
          }
        </div>
        {/* Unread indicator */}
        {conversation.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 bg-button-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {conversation.unread_count}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-text-primary font-semibold text-base truncate">
            {conversation.conversation_type === 'group' 
              ? conversation.event_title || 'Group Chat'
              : conversation.other_user_name || 'Unknown User'
            }
          </h3>
          <span className="text-text-secondary text-sm">
            {conversation.last_message?.created_at ? formatTimestamp(conversation.last_message?.created_at) : ''}
          </span>
        </div>
        <p className="text-text-secondary text-sm truncate">
          {conversation.last_message ? 
            (typeof conversation.last_message === 'string' 
              ? conversation.last_message 
              : conversation.last_message.message_text
            ) : 'No messages yet'}
        </p>
        {conversation.conversation_type === 'group' && (
          <p className="text-text-secondary text-xs">
            Group message • {conversation.participant_count || 1} participant
          </p>
        )}
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <button
          onClick={handleBack}
          className="flex items-center text-text-primary hover:text-text-secondary transition-colors"
        >
          <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <h1 className="text-lg font-semibold text-text-primary">
          Messages
        </h1>
      </div>

      {/* Debug Info */}
      <div className="px-4 py-2 bg-yellow-100 text-black text-xs">
        DEBUG: Private: {privateChats.length}, Group: {groupChats.length}
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red"></div>
        </div>
      ) : (privateChats.length > 0 || groupChats.length > 0) ? (
        <div className="flex-1">
          {/* Private Messages Section */}
          {privateChats.length > 0 && (
            <>
              <div className="px-4 py-2 bg-surface border-b border-text-secondary">
                <h3 className="text-text-primary font-semibold text-sm">Private Messages</h3>
              </div>
              {privateChats.map(renderConversationRow)}
            </>
          )}
          
          {/* Group Messages Section */}
          {groupChats.length > 0 && (
            <>
              <div className="px-4 py-2 bg-surface border-b border-text-secondary">
                <h3 className="text-text-primary font-semibold text-sm">Group Messages</h3>
              </div>
              {groupChats.map(renderConversationRow)}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 className="text-text-primary font-bold text-lg mb-2">No conversations yet</h2>
            <p className="text-text-secondary text-sm mb-4">Join event conversations by clicking "Chat" on event details.</p>
            <button
              onClick={() => router.push('/gigagent4u')}
              className="bg-button-red text-white px-6 py-3 rounded-xl font-semibold hover:bg-button-red-hover transition-colors"
            >
              Browse Events
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
