"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserConversations, joinConversation, EventConversation } from "@/utils/messageUtils";
import { supabase } from "@/lib/supabaseClient";

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<EventConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load conversations and handle event selection from eventdetail
  useEffect(() => {
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

        // Check if user came from eventdetail with event selection
        const selectedEventData = sessionStorage.getItem('selectedEventForChat');
        if (selectedEventData) {
          try {
            const eventData = JSON.parse(selectedEventData);
            // Join the conversation for this event
            await joinConversation(eventData.eventId, user.id);
            // Clear the session storage
            sessionStorage.removeItem('selectedEventForChat');
          } catch (error) {
            console.error('Error joining conversation:', error);
          }
        }

        // Load user's conversations
        const userConversations = await getUserConversations(user.id);
        setConversations(userConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  const handleConversationClick = (eventId: string) => {
    router.push(`/messages/${eventId}/openmessage`);
  };

  const handleNewMessage = () => {
    router.push("/messages/searchmessage");
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

  const renderConversationRow = (conversation: EventConversation) => (
    <div
      key={conversation.event_id}
      onClick={() => handleConversationClick(conversation.event_id)}
      className="flex items-center space-x-3 p-4 hover:bg-input-background cursor-pointer transition-colors border-b border-text-secondary"
    >
      {/* Event Avatar */}
      <div className="relative">
        <div className="w-12 h-12 bg-button-red rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {conversation.event_title.charAt(0).toUpperCase()}
        </div>
        {/* Unread indicator */}
        {conversation.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          </div>
        )}
      </div>

      {/* Conversation content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-text-primary font-semibold text-base truncate">
            {conversation.event_title}
          </h3>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <span className="text-text-secondary text-sm">
              {conversation.last_message ? formatTimestamp(conversation.last_message.created_at) : ''}
            </span>
          </div>
        </div>
        <p className="text-text-secondary text-sm mb-1">
          Posted by {conversation.promoter_name}
        </p>
        <p className="text-xs text-text-secondary mb-1">
          Group message • {conversation.participants.length} participant{conversation.participants.length !== 1 ? 's' : ''}
        </p>
        {conversation.last_message && (
          <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
            {conversation.last_message.sender_name}: {conversation.last_message.message_text}
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
        
        <button
          onClick={handleNewMessage}
          className="p-1 hover:bg-input-background rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red"></div>
        </div>
      ) : conversations.length > 0 ? (
        <div className="flex-1">
          {conversations.map(renderConversationRow)}
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
