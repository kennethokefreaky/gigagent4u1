"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getEventMessages, sendMessage, markMessagesAsRead, Message } from "@/utils/messageUtils";
import { supabase } from "@/lib/supabaseClient";

export default function OpenMessagePage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [eventInfo, setEventInfo] = useState<{
    title: string;
    promoter_name: string;
    participants: number;
  } | null>(null);

  // Load conversation data
  useEffect(() => {
    const loadConversation = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Error getting user:', authError);
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);

        // Get event info
        const { data: event, error: eventError } = await supabase
          .from('posts')
          .select(`
            title,
            promoter_id,
            profiles!posts_promoter_id_fkey(
              full_name
            )
          `)
          .eq('id', eventId)
          .single();

        if (eventError) {
          console.error('Error fetching event:', eventError);
          setLoading(false);
          return;
        }

        // Get participant count
        const { count: participantCount, error: countError } = await supabase
          .from('message_participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        setEventInfo({
          title: event.title,
          promoter_name: event.profiles?.full_name || 'Unknown',
          participants: participantCount || 0
        });

        // Load messages
        const eventMessages = await getEventMessages(eventId, user.id);
        setMessages(eventMessages);

        // Mark messages as read
        await markMessagesAsRead(eventId, user.id);

      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadConversation();
    }
  }, [eventId]);

  const handleSendMessage = async () => {
    if (messageText.trim() && currentUserId && eventId) {
      setSending(true);
      
      try {
        const newMessage = await sendMessage(eventId, currentUserId, messageText.trim());
        
        if (newMessage) {
          setMessages(prev => [...prev, newMessage]);
          setMessageText("");
          
          // Dispatch notification event for other participants
          window.dispatchEvent(new CustomEvent('messageSent', {
            detail: { eventId, message: newMessage }
          }));
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setSending(false);
      }
    }
  };

  const handleVideoCall = () => {
    // In real app, this would initiate a video call
    console.log("Starting video call with", conversation?.name);
  };

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.sender_id === currentUserId;
    const formatTime = (timestamp: string) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    return (
      <div
        key={message.id}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCurrentUser
            ? 'bg-button-red text-white'
            : 'bg-input-background text-text-primary'
        }`}>
          {!isCurrentUser && (
            <p className="text-xs font-semibold mb-1 opacity-70">
              {message.sender_name}
            </p>
          )}
          <p className="text-sm">{message.message_text}</p>
          <p className={`text-xs mt-1 ${
            isCurrentUser ? 'text-white opacity-70' : 'text-text-secondary'
          }`}>
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!eventInfo) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-text-primary font-bold text-lg mb-2">Event not found</h2>
          <button
            onClick={() => router.back()}
            className="text-button-red hover:text-button-red-hover transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Header */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-input-background rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 bg-button-red rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {eventInfo.title.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div>
            <h1 className="text-text-primary font-semibold text-base">{eventInfo.title}</h1>
            <p className="text-text-secondary text-sm">
              Posted by {eventInfo.promoter_name} • {eventInfo.participants} participant{eventInfo.participants !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={handleVideoCall}
          className="p-2 hover:bg-input-background rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length > 0 ? (
          messages.map(renderMessage)
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-secondary text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Composer */}
      <div className="bg-surface border-t border-text-secondary p-4">
        <div className="flex items-end space-x-3">
          <button className="p-2 hover:bg-input-background rounded-full transition-colors">
            <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-input-background text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 resize-none outline-none"
              rows={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className={`p-2 rounded-full transition-colors ${
              messageText.trim() && !sending
                ? "bg-button-red text-white hover:bg-button-red-hover"
                : "bg-input-background text-text-secondary cursor-not-allowed"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
