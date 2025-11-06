"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUnifiedMessages, sendUnifiedMessage, markUnifiedMessagesAsRead, UnifiedMessage } from "@/utils/unifiedMessagingUtils";
import { supabase } from "@/lib/supabaseClient";

export default function OpenMessagePage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  
  // This page is now only for private chats
  // Private chat format: talentId-promoterId (both are UUIDs, so we check for 2 UUIDs separated by a dash)
  const isPrivateChat = chatId.includes('-') && chatId.length > 36; // UUIDs are 36 chars, so private chat will be longer
  
  // If it's not a private chat format, redirect to group chat
  if (!isPrivateChat) {
    router.push(`/messages/${chatId}/groupchat`);
    return null;
  }
  
  console.log('🔍 Private chat detection:', { 
    chatId, 
    chatIdLength: chatId.length,
    hasDash: chatId.includes('-'),
    isPrivateChat
  });
  console.log('🔍 DEBUG: Full chatId value:', chatId);
  console.log('🔍 DEBUG: chatId type:', typeof chatId);
  
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll to bottom when page loads
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages.length]);

  const [eventInfo, setEventInfo] = useState<{
    title: string;
    promoter_name: string;
    promoter_email: string;
    participants: number;
    conversation_type: 'group' | 'private';
    conversation_title: string;
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
        console.log('🔍 DEBUG: Current User ID:', user.id);
        console.log('🔍 DEBUG: User ID type:', typeof user.id);
        console.log('🔍 DEBUG: User ID length:', user.id?.length);
        
        console.log('🔍 Loading private chat for chatId:', chatId);
        console.log('🔍 Current user ID:', user.id);
        
        // Handle private chat logic
        // Extract talentId and promoterId from conversation_id format: private_talentId-promoterId
        const withoutPrefix = chatId.replace('private_', '');
        const talentId = withoutPrefix.substring(0, 36);
        const promoterId = withoutPrefix.substring(37); // Skip the dash at position 36
        console.log('🔍 Private chat between talent:', talentId, 'and promoter:', promoterId);
        
        // Get promoter info
        const { data: promoter, error: promoterError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', promoterId)
          .single();

        if (promoterError) {
          console.error('❌ Error fetching promoter:', promoterError);
          setLoading(false);
          return;
        }

        // Determine the best display name with fallbacks
        let displayName = 'Unknown';
        if (promoter.full_name) {
          displayName = promoter.full_name;
        } else if (promoter.email) {
          displayName = promoter.email.split('@')[0]; // Use email prefix as fallback
        }

        console.log('✅ Promoter info fetched:', { displayName, email: promoter.email });

        setEventInfo({
          title: 'Private Chat',
          promoter_name: displayName,
          promoter_email: promoter.email || '',
          participants: 2,
          conversation_type: 'private',
          conversation_title: displayName
        });

        // Participants are handled automatically by unified table triggers
        
        // Load private chat messages
        // Convert old chatId format to new unified format
        // Old format: talentId-promoterId
        // New format: private_talentId-promoterId
        const unifiedConversationId = chatId.startsWith('private_') ? chatId : `private_${chatId}`;
        console.log('🔍 Converting chatId to unified format:', { oldChatId: chatId, newConversationId: unifiedConversationId });
        
        const unifiedMessages = await getUnifiedMessages(unifiedConversationId, user.id);
        setMessages(unifiedMessages);
        
        // Mark messages as read
        try {
          await markUnifiedMessagesAsRead(unifiedConversationId, user.id);
        } catch (markReadError) {
          console.error('Error marking private chat messages as read:', markReadError);
        }
        
        console.log('✅ Private chat setup complete');

      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      loadConversation();
    }
  }, [chatId]);

  const handleSendMessage = async () => {
    if (messageText.trim() && currentUserId) {
      setSending(true);
      
      try {
        // Convert old chatId format to new unified format
        const unifiedConversationId = chatId.startsWith('private_') ? chatId : `private_${chatId}`;
        console.log('🔍 DEBUG: Original chatId:', chatId);
        console.log('🔍 DEBUG: Unified conversation ID:', unifiedConversationId);
        
        // Send unified message
        const newMessage = await sendUnifiedMessage(unifiedConversationId, 'private', currentUserId, messageText.trim());
        
        if (newMessage) {
          setMessages(prev => [...prev, newMessage]);
          setMessageText("");
          
          console.log('✅ Private chat message sent successfully');
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setSending(false);
      }
    }
  };


  const renderMessage = (message: UnifiedMessage) => {
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
    <div className="h-screen bg-background text-text-primary flex flex-col">
      {/* Header - Fixed */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary flex-shrink-0">
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-blue-500">
              {eventInfo.promoter_name.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div>
            <h1 className="text-text-primary font-semibold text-base">{eventInfo.conversation_title}</h1>
            <p className="text-text-secondary text-sm">
              Private chat with {eventInfo.promoter_name} • 1-on-1
            </p>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {messages.length > 0 ? (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-secondary text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Composer - Fixed at bottom */}
      <div className="bg-surface border-t border-text-secondary p-4 flex-shrink-0">
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12l20 0M12 2l10 10-10 10" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
