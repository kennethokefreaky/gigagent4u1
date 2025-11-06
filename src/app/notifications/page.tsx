"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useNotifications } from "../../contexts/NotificationContext";
import Navigation from "../components/Navigation";
import { handleOfferAcceptance, handleOfferEdit } from "../../utils/offerUtils";
import { supabase } from "../../lib/supabaseClient";

interface Notification {
  id: string;
  type: 'first_event' | 'new_message' | 'location_based' | 'offer_received' | 'offer_accepted' | 'offer_edited' | 'counter_offer';
  title: string;
  message: string;
  buttonText: string;
  buttonAction: () => void;
  icon: string;
  timeAgo: string;
  isRead: boolean;
  showConfetti?: boolean;
  // Additional fields for offer notifications
  offer_amount?: number;
  event_name?: string;
  promoter_name?: string;
  promoter_id?: string;
  event_id?: string;
  data?: any;
}

// Helper functions to extract data from notification messages
const extractEventTitleFromMessage = (message: string): string => {
  const eventTitleMatch = message.match(/"([^"]+)"/);
  return eventTitleMatch ? eventTitleMatch[1] : 'Recent Event';
};

const extractAmountFromMessage = (message: string): string => {
  const amountMatch = message.match(/\$([\d,]+)/);
  return amountMatch ? amountMatch[1] : '0';
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showOfferBottomSheet, setShowOfferBottomSheet] = useState(false);
  const [selectedOfferNotification, setSelectedOfferNotification] = useState<any>(null);
  const [showJoinGroupChatPopup, setShowJoinGroupChatPopup] = useState(false);
  const [acceptedEventData, setAcceptedEventData] = useState<any>(null);
  const [showAlreadyAcceptedPopup, setShowAlreadyAcceptedPopup] = useState(false);
  const [alreadyAcceptedEventData, setAlreadyAcceptedEventData] = useState<any>(null);

  // Mark all notifications as read when user visits the page
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Check if user needs verification and show modal
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, talent_categories, verification_status')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          return;
        }

        // Show verification modal if user has fighting sports and skipped verification
        if (profile.role === "talent" && profile.talent_categories && profile.verification_status === 'skipped') {
          const fightingSports = ['Boxer', 'MMA', 'Wrestler'];
          const hasFightingSports = profile.talent_categories.some((cat: string) => fightingSports.includes(cat));
          
          if (hasFightingSports) {
            setNeedsVerification(true);
            setShowVerificationModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking verification status in NotificationsPage:', error);
      }
    };

    checkVerificationStatus();
  }, []);

  // Handle verification modal
  const handleGetVerified = async () => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("No authenticated user for verification:", authError);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('talent_categories, full_name')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error loading profile for verification:", profileError);
        return;
      }

      // Mark that user took action on the verification modal
      console.log('Notifications: User clicked "Get Verified" - setting verificationModalDismissed = true');
      localStorage.setItem('verificationModalDismissed', 'true');
      
      // Parse talent categories from array to comma-separated string
      let rolesParam = '';
      if (profile.talent_categories && profile.talent_categories.length > 0) {
        rolesParam = profile.talent_categories.join(',');
        console.log('Notifications: Parsed talent categories for verifyid:', profile.talent_categories, '->', rolesParam);
      }
      
      const name = profile.full_name || 'User';
      
      // Navigate to verifyid page with proper parameters
      router.push(`/verifyid?name=${encodeURIComponent(name)}&roles=${encodeURIComponent(rolesParam)}&country=United States`);
    } catch (error) {
      console.error('Error in handleGetVerified:', error);
    }
  };

  const handleCloseVerificationModal = () => {
    console.log('Notifications: User clicked "Later" - NOT setting verificationModalDismissed');
    setShowVerificationModal(false);
    // Don't mark as dismissed - user can still see the badge when they leave
    // Only mark as dismissed when they actually click "Get Verified"
  };

  // Trigger confetti animation
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Check if talent has already accepted an offer for this event
  const hasAlreadyAcceptedOffer = async (talentId: string, eventId: string): Promise<boolean> => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Check if there's already an accepted notification for this talent and event
      const { data: acceptedNotification, error: notificationError } = await supabase
        .from('notifications')
        .select('id, button_text')
        .eq('user_id', talentId)
        .eq('event_id', eventId)
        .eq('type', 'offer_received')
        .in('button_text', ['Accepted', 'accepted'])
        .single();

      if (notificationError && notificationError.code !== 'PGRST116') {
        console.error('Error checking accepted notification:', notificationError);
        return false;
      }

      // Also check if there's a candidate record (as backup)
      try {
        const { data: candidate, error: candidateError } = await supabase
          .from('candidates')
          .select('id')
          .eq('talent_id', talentId)
          .eq('event_id', eventId)
          .single();

        if (candidateError && candidateError.code !== 'PGRST116') {
          console.log('Candidate check failed (likely RLS), using notification check only');
        } else if (candidate) {
          return true;
        }
      } catch (candidateError) {
        console.log('Candidate table access failed, using notification check only');
      }

      return !!acceptedNotification;
    } catch (error) {
      console.error('Error checking if offer was already accepted:', error);
      return false;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Handle specific actions
    if (notification.type === 'first_event') {
      triggerConfetti();
      router.push('/promotertalentlist');
    } else if (notification.type === 'event_posted') {
      router.push('/gigagent4u');
    } else if (notification.type === 'talent_accepted') {
      router.push('/promotertalentlist');
    } else if (notification.type === 'offer_received') {
      // Check if user has already accepted an offer for this event
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('No authenticated user:', authError);
        return;
      }

      const eventId = notification.event_id;
      if (eventId) {
        const alreadyAccepted = await hasAlreadyAcceptedOffer(user.id, eventId);
        
        if (alreadyAccepted) {
          // Show "already accepted" popup
          setAlreadyAcceptedEventData({
            eventTitle: notification.event_name || extractEventTitleFromMessage(notification.message),
            amount: notification.offer_amount || extractAmountFromMessage(notification.message)
          });
          setShowAlreadyAcceptedPopup(true);
          return;
        }
      }
      
      setSelectedOfferNotification(notification);
      setShowOfferBottomSheet(true);
    } else if (notification.type === 'new_message') {
      // Route directly to the exact chat (group/private) without touching badges
      (async () => {
        try {
          // 1) Prefer explicit conversation fields if present in payload
          if (notification.data?.conversation_id && notification.data?.conversation_type) {
            const href = notification.data.conversation_type === 'group'
              ? `/messages/${notification.data.conversation_id}/groupchat`
              : `/messages/${notification.data.conversation_id}/openmessage`;
            return router.push(href);
          }

          // 2) Load stored fields from notifications row
          const { data: row } = await supabase
            .from('notifications')
            .select('conversation_id, conversation_type, event_id, chat_id')
            .eq('id', notification.id)
            .single();

          if (row?.conversation_id && row?.conversation_type) {
            const href = row.conversation_type === 'group'
              ? `/messages/${row.conversation_id}/groupchat`
              : `/messages/${row.conversation_id}/openmessage`;
            return router.push(href);
          }

          // 3) Group fallback: map event_id -> unified_conversations.id
          if (row?.event_id || notification.data?.event_id) {
            const eventId = row?.event_id || notification.data?.event_id;
            const { data: conv } = await supabase
              .from('unified_conversations')
              .select('id')
              .eq('conversation_type', 'group')
              .eq('event_id', eventId)
              .limit(1)
              .single();
            const targetId = conv?.id || eventId; // fallback if mapping missing
            return router.push(`/messages/${targetId}/groupchat`);
          }

          // 4) Private fallback: use chat_id if provided
          if (row?.chat_id || notification.data?.chat_id) {
            const chatId = row?.chat_id || notification.data?.chat_id;
            return router.push(`/messages/${chatId}/openmessage`);
          }

          // 5) Final fallback
          router.push('/messages');
        } catch (e) {
          router.push('/messages');
        }
      })();
    } else if (notification.type === 'location_based' || notification.type === 'breakfast_reminder' || notification.type === 'lunch_reminder' || notification.type === 'dinner_reminder') {
      // Store the search term and navigate to map
      if (notification.message.includes('McDonald')) {
        sessionStorage.setItem('mapSearch', 'McDonald\'s breakfast');
      } else if (notification.message.includes('Club Paradise')) {
        sessionStorage.setItem('mapSearch', 'Club Paradise');
      } else if (notification.type === 'breakfast_reminder') {
        sessionStorage.setItem('mapSearch', 'breakfast restaurants');
        sessionStorage.setItem('mealTime', 'breakfast');
      } else if (notification.type === 'lunch_reminder') {
        sessionStorage.setItem('mapSearch', 'lunch restaurants');
        sessionStorage.setItem('mealTime', 'lunch');
      } else if (notification.type === 'dinner_reminder') {
        sessionStorage.setItem('mapSearch', 'dinner restaurants');
        sessionStorage.setItem('mealTime', 'dinner');
      }
      router.push('/map');
    } else if (notification.type === 'verification_required') {
      setShowVerificationModal(true);
    } else if (notification.type === 'offer_accepted' || notification.type === 'offer_edited') {
      // Navigate to promoter's candidate list with event focus
      const eventId = notification.event_id || notification.data?.event_id;
      if (eventId) {
        // Store event ID in sessionStorage for the Tabs component to use
        sessionStorage.setItem('focusEventId', eventId);
        sessionStorage.setItem('focusTab', 'Candidates');
      }
      router.push('/gigagent4u');
    }
  };

  const handleAcceptOffer = async () => {
    if (!selectedOfferNotification) return;

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('No authenticated user:', authError);
        return;
      }

      // Double-check if offer was already accepted before proceeding
      const eventId = selectedOfferNotification.event_id;
      if (eventId) {
        const alreadyAccepted = await hasAlreadyAcceptedOffer(user.id, eventId);
        
        if (alreadyAccepted) {
          console.log('❌ Offer already accepted, preventing duplicate acceptance');
          setAlreadyAcceptedEventData({
            eventTitle: selectedOfferNotification.event_name || extractEventTitleFromMessage(selectedOfferNotification.message),
            amount: selectedOfferNotification.offer_amount || extractAmountFromMessage(selectedOfferNotification.message)
          });
          setShowAlreadyAcceptedPopup(true);
          setShowOfferBottomSheet(false);
          setSelectedOfferNotification(null);
          return;
        }
      }

      // Extract amount from notification message
      const amountMatch = selectedOfferNotification.message.match(/\$([\d,]+)/);
      const amount = amountMatch ? amountMatch[1] : '0';

      // Extract event title from notification message
      const eventTitleMatch = selectedOfferNotification.message.match(/"([^"]+)"/);
      const eventTitle = eventTitleMatch ? eventTitleMatch[1] : 'Recent Event';

      // Get promoter ID from notification
      const promoterId = selectedOfferNotification.promoter_id;
      
      if (!promoterId || !eventId) {
        console.error('❌ Missing promoter_id or event_id in notification:', {
          promoterId,
          eventId,
          notification: selectedOfferNotification
        });
        
        alert('This offer notification is missing required information. Please try refreshing the page or contact support.');
        setShowOfferBottomSheet(false);
        setSelectedOfferNotification(null);
        return;
      }

      console.log('🔍 Offer acceptance data:', {
        notificationId: selectedOfferNotification.id,
        talentId: user.id,
        promoterId,
        amount,
        eventId,
        eventTitle
      });

      // Handle offer acceptance
      const acceptanceResult = await handleOfferAcceptance(selectedOfferNotification.id, user.id, promoterId, amount, eventId, eventTitle);
      
      if (!acceptanceResult) {
        console.error('❌ Offer acceptance failed');
        alert('Failed to accept the offer. Please try again.');
        return;
      }
      
      // Add talent to group chat
      const groupChatResult = await addTalentToGroupChat(eventId, user.id, promoterId, eventTitle);
      
      if (!groupChatResult) {
        console.error('❌ Failed to add talent to group chat');
        alert('Offer accepted but failed to join group chat. Please contact support.');
        return;
      }
      
      // Only show success popup if everything succeeded
      setAcceptedEventData({
        eventTitle,
        promoterId,
        amount
      });
      setShowJoinGroupChatPopup(true);
      
      setShowOfferBottomSheet(false);
      setSelectedOfferNotification(null);
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const addTalentToGroupChat = async (eventId: string, talentId: string, promoterId: string, eventTitle: string): Promise<boolean> => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Get talent profile information
      const { data: talentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, username, email')
        .eq('id', talentId)
        .single();

      if (profileError) {
        console.error('Error fetching talent profile:', profileError);
        return false;
      }

      const talentName = talentProfile.full_name || talentProfile.username || talentProfile.email?.split('@')[0] || 'Talent';

      // Add talent to message_participants table
      const { error: participantError } = await supabase
        .from('message_participants')
        .insert({
          event_id: eventId,
          user_id: talentId,
          role: 'talent',
          joined_at: new Date().toISOString()
        });

      if (participantError) {
        console.error('Error adding talent to message_participants:', participantError);
        return false;
      }

      // Add talent to unified_participants table
      const { error: unifiedParticipantError } = await supabase
        .from('unified_participants')
        .insert({
          conversation_id: `group_${eventId}`,
          user_id: talentId,
          conversation_type: 'group',
          event_id: eventId,
          last_read_at: new Date().toISOString(),
          participant_name: talentName,
          participant_email: talentProfile.email
        });

      if (unifiedParticipantError) {
        console.error('Error adding talent to unified_participants:', unifiedParticipantError);
        return false;
      }

      // Send welcome message to group chat
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          event_id: eventId,
          sender_id: promoterId,
          message_text: `${talentName} has been added to the group chat for "${eventTitle}". Welcome!`,
          message_type: 'system',
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('Error sending welcome message:', messageError);
        // Don't return false here as the main functionality (adding participant) succeeded
      }

      // Add to unified_messages table as well
      const { error: unifiedMessageError } = await supabase
        .from('unified_messages')
        .insert({
          conversation_id: `group_${eventId}`,
          sender_id: promoterId,
          message_text: `${talentName} has been added to the group chat for "${eventTitle}". Welcome!`,
          message_type: 'system',
          sender_name: 'System',
          created_at: new Date().toISOString()
        });

      if (unifiedMessageError) {
        console.error('Error adding welcome message to unified_messages:', unifiedMessageError);
        // Don't return false here as the main functionality (adding participant) succeeded
      }

      console.log('✅ Talent added to group chat successfully');
      return true;

    } catch (error) {
      console.error('Error adding talent to group chat:', error);
      return false;
    }
  };

  const handleEditOffer = async () => {
    console.log('🔍 handleEditOffer called');
    
    if (!selectedOfferNotification) {
      console.error('❌ No offer notification selected');
      return;
    }
    
    console.log('🔍 Full notification object:', selectedOfferNotification);
    console.log('🔍 Notification message:', selectedOfferNotification.message);
    console.log('🔍 Notification type:', selectedOfferNotification.type);
    
    // Simple extraction from message
    const amountMatch = selectedOfferNotification.message.match(/\$([\d,]+)/);
    const eventMatch = selectedOfferNotification.message.match(/"([^"]+)"/);
    
    const amount = amountMatch ? amountMatch[1] : '0';
    const eventTitle = eventMatch ? eventMatch[1] : 'Unknown Event';
    
    console.log('🔍 Extracted:', { amount, eventTitle });
    
    // Create simple data object
    const notificationData = {
      id: selectedOfferNotification.id,
      offer_amount: parseFloat(amount),
      event_name: eventTitle,
      promoter_name: 'A promoter',
      promoter_id: 'unknown',
      event_id: 'unknown'
    };
    
    console.log('🔍 Data to store:', notificationData);
    
    try {
      // Store in sessionStorage
      sessionStorage.setItem('editOfferData', JSON.stringify(notificationData));
      console.log('🔍 Data stored successfully');
      
      // Navigate immediately
      router.push('/edit-offer');
      console.log('🔍 Navigation called');
      
    } catch (error) {
      console.error('🔍 Error:', error);
      alert('Error: ' + error.message);
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      {/* Header - Similar to gigagent4u */}
      <div className="bg-background px-4 py-4">
        <div className="flex items-center space-x-3">
          {/* Profile Picture */}
          <div className="w-10 h-10 rounded-full bg-input-background flex items-center justify-center relative">
            <svg className="w-6 h-6 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 bg-input-background rounded-lg px-4 py-3 flex items-center space-x-3">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-text-secondary">Search notifications</span>
          </div>

          {/* Menu Button */}
          <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 px-4 py-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-blue-50 rounded-xl p-4 mb-4 transition-all duration-200 ${
              !notification.isRead ? 'border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Notification Icon */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg">
                  {notification.icon}
                </div>
              </div>

              {/* Notification Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
                      {notification.title}
                    </h3>
                    <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  
                  {/* Time and Menu */}
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    <span className="text-xs text-gray-500">{notification.timeAgo}</span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full"
                >
                  {notification.buttonText}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state if no notifications */}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500 text-center">You'll see updates about events, messages, and nearby activities here.</p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <Navigation />

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleCloseVerificationModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center">Verification Required</h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-center leading-relaxed mb-6">
                As a professional athlete in combat sports (Boxer, MMA, or Wrestler), you are required to have a valid athletic license to participate in events and competitions on our platform.
              </p>
              <p className="text-gray-600 text-center leading-relaxed mb-6">
                Please complete your verification to access all features and opportunities available to you.
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex border-t border-gray-200">
              <button 
                onClick={handleCloseVerificationModal}
                className="flex-1 py-4 px-6 text-gray-600 font-semibold hover:bg-gray-50 transition-colors border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Later
              </button>
              <button 
                onClick={handleGetVerified}
                className="flex-1 py-4 px-6 bg-button-red text-white font-semibold hover:bg-button-red-hover transition-colors focus:outline-none focus:ring-2 focus:ring-button-red"
              >
                Get Verified
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Response Bottom Sheet */}
      {showOfferBottomSheet && selectedOfferNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 min-h-[50vh] bottom-sheet">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowOfferBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Cancel
              </button>
              <h3 className="text-subheading font-semibold">Respond to Offer</h3>
              <div className="w-16"></div>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-text-secondary text-sm mb-2">Original Offer</p>
              <p className="text-2xl font-bold text-text-primary">
                {selectedOfferNotification.message.match(/\$([\d,]+)/)?.[0] || '$0'}
              </p>
              <p className="text-text-secondary text-xs mt-2">
                {selectedOfferNotification.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleAcceptOffer}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Accept Offer
              </button>
              
              <button
                onClick={handleEditOffer}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Edit Offer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Join Group Chat Popup */}
      {showJoinGroupChatPopup && acceptedEventData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Offer Accepted Successfully!</h3>
            <p className="text-gray-600 mb-4">
              You've successfully accepted the offer for <strong>{acceptedEventData.eventTitle}</strong>. 
              Join the group chat to connect with the promoter and other talents.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowJoinGroupChatPopup(false);
                  setAcceptedEventData(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  try {
                    // Get current user
                    const { data: { user }, error: authError } = await supabase.auth.getUser();
                    if (authError || !user) {
                      console.error('No authenticated user:', authError);
                      return;
                    }

                    // Method 1: Try to get event ID from notifications
                    console.log('🔍 Method 1: Looking for notifications with event_id...');
                    const { data: notifications, error: notificationsError } = await supabase
                      .from('notifications')
                      .select('event_id, promoter_id, type, button_text, message')
                      .eq('user_id', user.id)
                      .eq('type', 'offer_received');

                    console.log('🔍 Found notifications:', notifications);

                    let eventId = null;

                    // Try to find a notification with event_id
                    if (notifications && notifications.length > 0) {
                      const notificationWithEventId = notifications.find(n => n.event_id);
                      if (notificationWithEventId) {
                        eventId = notificationWithEventId.event_id;
                        console.log('🔍 Found event_id from notification:', eventId);
                      }
                    }

                    // Method 2: If no event_id found, try to find by event title
                    if (!eventId && acceptedEventData?.eventTitle) {
                      console.log('🔍 Method 2: Looking for event by title:', acceptedEventData.eventTitle);
                      
                      const { data: event, error: eventError } = await supabase
                        .from('posts')
                        .select('id, title')
                        .ilike('title', `%${acceptedEventData.eventTitle}%`)
                        .single();
                      
                      if (event?.id) {
                        eventId = event.id;
                        console.log('🔍 Found event by title:', eventId);
                      } else {
                        console.errorr('❌ Could not find event by title:', eventError);
                      }
                    }

                    // Method 3: If still no event found, try to find any recent event
                    if (!eventId) {
                      console.log('🔍 Method 3: Looking for any recent event...');
                      
                      const { data: recentEvent, error: recentEventError } = await supabase
                        .from('posts')
                        .select('id, title')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                      
                      if (recentEvent?.id) {
                        eventId = recentEvent.id;
                        console.log('🔍 Using recent event as fallback:', eventId);
                      } else {
                        console.errorr('❌ No events found at all:', recentEventError);
                      }
                    }

                    // Add talent to group chat if we found an event
                    if (eventId) {
                      console.log('🔍 Adding talent to group chat for event:', eventId);
                      
                      const { error: joinError } = await supabase
                        .from('message_participants')
                        .upsert({
                          event_id: eventId,
                          user_id: user.id,
                          joined_at: new Date().toISOString(),
                          last_read_at: new Date().toISOString()
                        }, {
                          onConflict: 'event_id,user_id'
                        });

                      if (joinError) {
                        console.errorr('❌ Error joining group chat:', joinError);
                      } else {
                        console.log('✅ Successfully joined group chat for event:', eventId);
                      }
                    } else {
                      console.error('❌ No event found to join group chat');
                    }

                    setShowJoinGroupChatPopup(false);
                    setAcceptedEventData(null);
                    router.push('/messages');
                  } catch (error) {
                    console.error('Error joining group chat:', error);
                  }
                }}
                className="flex-1 bg-button-red hover:bg-button-red-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Join Group Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already Accepted Offer Popup */}
      {showAlreadyAcceptedPopup && alreadyAcceptedEventData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">You Already Accepted This Offer!</h3>
            <p className="text-gray-600 mb-4">
              You've already accepted the offer for <strong>{alreadyAcceptedEventData.eventTitle}</strong>. 
              You can't accept the same offer twice. Go to messages to connect with the promoter and other talents.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAlreadyAcceptedPopup(false);
                  setAlreadyAcceptedEventData(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAlreadyAcceptedPopup(false);
                  setAlreadyAcceptedEventData(null);
                  router.push('/messages');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Go to Messages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}