"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getGroupChatMessages, sendGroupChatMessage, markGroupChatMessagesAsRead, GroupChatMessage } from "@/utils/groupChatUtils";
import { markUnifiedMessagesAsRead } from "@/utils/unifiedMessagingUtils";
import { getGroupChatParticipants, createMentionNotifications } from "@/utils/mentionUtils";
import { supabase } from "@/lib/supabaseClient";

export default function GroupChatPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  } | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [promoterId, setPromoterId] = useState<string | null>(null);

  // Load group chat data
  useEffect(() => {
    const loadGroupChat = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Error getting user:', authError);
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);
        
        console.log('🔍 Loading group chat for eventId:', eventId);
        console.log('🔍 Current user ID:', user.id);

        // Check if user is a participant in EITHER system
        const conversationId = `group_${eventId}`;
        
        // Check unified_participants first (where talents are added when they apply)
        const { data: unifiedParticipant, error: unifiedError } = await supabase
          .from('unified_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .single();

        // Check message_participants as fallback
        const { data: messageParticipant, error: messageError } = await supabase
          .from('message_participants')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single();

        // User must be in at least one system
        if ((unifiedError || !unifiedParticipant) && (messageError || !messageParticipant)) {
          console.error('❌ User is not a participant in this group chat:', { unifiedError, messageError });
          // Redirect back to messages page
          router.push('/messages');
          return;
        }

        console.log('✅ User is a participant in group chat (unified:', !!unifiedParticipant, 'message:', !!messageParticipant, ')');
        
        console.log('✅ User is a valid participant in group chat');

        // Get event info
        const { data: event, error: eventError } = await supabase
          .from('posts')
          .select('title, promoter_id')
          .eq('id', eventId)
          .single();

        if (eventError) {
          console.error('❌ Error fetching event:', eventError);
          if (eventError.code === 'PGRST116') {
            console.log('❌ Event not found, redirecting back to messages');
            router.push('/messages');
            return;
          }
          setLoading(false);
          return;
        }

        console.log('✅ Event fetched successfully:', event);

        // Store promoter ID for filtering
        setPromoterId(event.promoter_id);

        // Get promoter info
        let promoterName = 'Unknown';
        let promoterEmail = '';
        if (event.promoter_id) {
          const { data: promoter, error: promoterError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', event.promoter_id)
            .single();

          if (!promoterError && promoter) {
            promoterName = promoter.full_name || (promoter.email ? promoter.email.split('@')[0] : 'Unknown');
            promoterEmail = promoter.email || '';
            console.log('✅ Promoter info fetched:', promoter);
          } else {
            console.error('❌ Error fetching promoter:', promoterError);
          }
        }

        // Get participant count using OLD SYSTEM
        const { count: participantCount, error: countError } = await supabase
          .from('message_participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        setEventInfo({
          title: event.title,
          promoter_name: promoterName,
          promoter_email: promoterEmail,
          participants: participantCount || 0
        });

        // Load group chat messages
        const groupMessages = await getGroupChatMessages(eventId, user.id);
        setMessages(groupMessages);
        
        // Mark messages as read
        try {
          await markUnifiedMessagesAsRead(conversationId, user.id);
        } catch (markReadError) {
          console.error('Error marking group chat messages as read:', markReadError);
        }

        // Load participants for @ mentions
        const groupParticipants = await getGroupChatParticipants(eventId);
        setParticipants(groupParticipants);
        
        console.log('🔍 Group chat participants loaded:', groupParticipants.length, groupParticipants);

        console.log('✅ Group chat setup complete');

      } catch (error) {
        console.error('Error loading group chat:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadGroupChat();
    }
  }, [eventId, router]);

  const handleSendMessage = async () => {
    if (messageText.trim() && currentUserId) {
      setSending(true);
      
      try {
        // Validate participant first
        // Check if user is a participant in EITHER system
        const conversationId = `group_${eventId}`;
        
        // Check unified_participants first (where talents are added when they apply)
        const { data: unifiedParticipant, error: unifiedError } = await supabase
          .from('unified_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId)
          .single();

        // Check message_participants as fallback
        const { data: messageParticipant, error: messageError } = await supabase
          .from('message_participants')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('user_id', currentUserId)
          .single();

        // User must be in at least one system
        if ((unifiedError || !unifiedParticipant) && (messageError || !messageParticipant)) {
          console.error('❌ User is not a participant in this group chat:', { unifiedError, messageError });
          return;
        }

        console.log('✅ User is a participant in group chat (unified:', !!unifiedParticipant, 'message:', !!messageParticipant, ')');

        // Send group chat message
        const newMessage = await sendGroupChatMessage(eventId, currentUserId, messageText.trim());
        
        if (newMessage) {
          setMessages(prev => [...prev, newMessage]);
          
          // Handle @ mentions
          if (messageText.includes('@')) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', currentUserId)
              .single();
            
            const senderName = senderProfile?.full_name || 'Someone';
            await createMentionNotifications(eventId, messageText, currentUserId, senderName);
          }
          
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const renderWelcomeMessage = () => {
    if (!eventInfo) return null;
    
    return (
      <div className="flex justify-center mb-6">
        <div className="max-w-sm mx-4 px-6 py-4 rounded-lg bg-surface border border-text-secondary">
          <div className="text-center">
            <div className="w-12 h-12 bg-button-red rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
              {eventInfo.title.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-text-primary font-bold text-base mb-2">
              Welcome to "{eventInfo.title}"!
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              This is the group chat for this unique event. Please be respectful, 
              share relevant information, and help create a positive community experience. 
              Use @ to mention other participants.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderTalentAddedStatuses = () => {
    console.log('🔍 DEBUG: renderTalentAddedStatuses called', { 
      participants, 
      promoterId, 
      participantsLength: participants?.length 
    });

    if (!participants || !promoterId) {
      console.log('🔍 DEBUG: Early return - missing data', { participants: !!participants, promoterId: !!promoterId });
      return null;
    }

    // Filter out promoters to get only talents
    // participants is an array of MentionUser objects with { id, name, avatar }
    const talents = participants.filter(participant => 
      participant.id !== promoterId && 
      participant.name
    );

    console.log('🔍 DEBUG: Filtered talents', { 
      allParticipants: participants, 
      talents, 
      talentsLength: talents.length,
      promoterId 
    });

    if (talents.length === 0) return null;

    return (
      <div className="text-center mb-4">
        {talents.map(talent => (
          <p key={talent.id} className="text-text-secondary text-sm">
            {talent.name} has been added into the group
          </p>
        ))}
      </div>
    );
  };

  const renderMessage = (message: GroupChatMessage) => {
    const isCurrentUser = message.sender_id === currentUserId;
    
    return (
      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-button-red text-white' 
            : 'bg-input-background text-text-primary'
        }`}>
          {!isCurrentUser && (
            <p className="text-xs font-semibold mb-1 opacity-70">
              {message.sender_name && message.sender_name.trim() ? message.sender_name : 'Unknown'}
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
          <p className="text-text-secondary">Loading group chat...</p>
        </div>
      </div>
    );
  }

  if (!eventInfo) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-text-primary font-bold text-lg mb-2">Group chat not found</h2>
          <button
            onClick={() => router.push('/messages')}
            className="text-button-red hover:text-button-red-hover transition-colors"
          >
            Go back to messages
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
            onClick={() => router.push('/messages')}
            className="p-1 hover:bg-input-background rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-button-red">
              {eventInfo.title.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div>
            <h1 className="text-text-primary font-semibold text-base">{eventInfo.title}</h1>
            <p className="text-text-secondary text-sm">
              Group chat • {eventInfo.participants} participant{eventInfo.participants !== 1 ? 's' : ''} • Posted by {eventInfo.promoter_name}
            </p>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {/* Welcome message - always show at top */}
        {renderWelcomeMessage()}
        
        {/* Talent added statuses - centered text like WhatsApp */}
        {renderTalentAddedStatuses()}
        
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-secondary text-lg mb-2">No messages yet</p>
              <p className="text-text-secondary text-sm">Start the group conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="bg-surface border-t border-text-secondary px-4 py-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-button-red rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {currentUserId ? currentUserId.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                // Check for @ mention
                const cursorPos = e.target.selectionStart || 0;
                const textBeforeCursor = e.target.value.substring(0, cursorPos);
                const lastAtIndex = textBeforeCursor.lastIndexOf('@');
                
                if (lastAtIndex !== -1) {
                  const query = textBeforeCursor.substring(lastAtIndex + 1);
                  setMentionQuery(query);
                  // Show dropdown immediately after typing '@', even if query is empty
                  setShowMentionDropdown(true);
                } else {
                  setShowMentionDropdown(false);
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
              placeholder="Type a message... (use @ to mention someone)"
              className="w-full bg-input-background text-text-primary px-4 py-2 rounded-lg border border-text-secondary focus:outline-none focus:border-button-red"
              disabled={sending}
              ref={inputRef}
            />
            
            {/* @ Mention Dropdown */}
            {showMentionDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-text-secondary rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                {participants.length === 0 ? (
                  <div className="px-3 py-2 text-text-secondary text-sm">
                    No participants available for mentions
                  </div>
                ) : (
                  participants
                    .filter(participant => {
                      const q = mentionQuery.trim().toLowerCase();
                      if (!q) return true; // show all when just '@'
                      return participant.name.toLowerCase().includes(q);
                    })
                    .map(participant => (
                      <button
                        key={participant.id}
                        onClick={() => {
                          const cursorPos = inputRef.current?.selectionStart || 0;
                          const textBeforeCursor = messageText.substring(0, cursorPos);
                          const lastAtIndex = textBeforeCursor.lastIndexOf('@');
                          const newText = messageText.substring(0, lastAtIndex) + `@${participant.name} ` + messageText.substring(cursorPos);
                          setMessageText(newText);
                          setShowMentionDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-input-background flex items-center space-x-2"
                      >
                        <div className="w-6 h-6 bg-button-red rounded-full flex items-center justify-center text-white text-xs">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-text-primary">{participant.name}</span>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="p-2 bg-button-red text-white rounded-lg hover:bg-button-red-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12l20 0M12 2l10 10-10 10" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
