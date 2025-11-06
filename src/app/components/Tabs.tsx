"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EventData, getAllEvents, getAllPostsFromSupabase, getActiveEvents, getPastEvents, getAllTalentUsers } from "../../utils/eventUtils";
import { getCandidatesByPromoter, groupCandidatesByEvent, Candidate } from "../../utils/candidateUtils";
import { getApplicationsWithEventDetails } from "../../utils/applicationUtils";
import { getUserPrimaryLocation } from "../../utils/locationStorageUtils";
import { getPastEventsWithTrash } from "../../utils/trashUtils";

type TabType = "My Events" | "Candidates" | "Past Events" | "Events" | "Past Events";

interface TabsProps {
  userType: string;
}

export default function Tabs({ userType }: TabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(userType === "promoter" ? "My Events" : "Events");
  const [postedEvents, setPostedEvents] = useState<EventData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [talentCount, setTalentCount] = useState<number>(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [hasCreatedEvents, setHasCreatedEvents] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ city: string; state: string } | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [endModal, setEndModal] = useState<{ open: boolean; eventId: string | null; message: string }>(
    { open: false, eventId: null, message: '' }
  );
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
  const [restoreModal, setRestoreModal] = useState<{ open: boolean; eventId: string | null; eventTitle: string }>(
    { open: false, eventId: null, eventTitle: '' }
  );
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);

  const toggleEventExpanded = (eventTitle: string) => {
    setExpandedEvents(prev => ({ ...prev, [eventTitle]: !prev[eventTitle] }));
  };

  // Debug: Log the userType and activeTab
  console.log('Tabs: userType =', userType);
  console.log('Tabs: activeTab =', activeTab);

  const tabs: TabType[] = userType === "promoter" 
    ? ["My Events", "Candidates", "Past Events"] 
    : userType === "talent"
    ? ["Events", "Past Events"]
    : []; // Empty array while loading

  // Ensure activeTab is set correctly when userType changes
  useEffect(() => {
    if (userType) { // Only set activeTab when userType is determined
      // Check if we should focus on a specific tab from notification
      const focusTab = sessionStorage.getItem('focusTab');
      const focusEventId = sessionStorage.getItem('focusEventId');
      
      if (focusTab && focusEventId && userType === "promoter") {
        console.log('Tabs: Focusing on tab =', focusTab, 'for event =', focusEventId);
        setActiveTab(focusTab as TabType);
        setFocusedEventId(focusEventId);
        // Clear the sessionStorage after using it
        sessionStorage.removeItem('focusTab');
        sessionStorage.removeItem('focusEventId');
      } else {
        const correctActiveTab = userType === "promoter" ? "My Events" : "Events";
        console.log('Tabs: Setting activeTab to =', correctActiveTab);
        setActiveTab(correctActiveTab);
      }
    }
  }, [userType]);

  // Prevent switching to Candidates tab if promoter hasn't created events
  useEffect(() => {
    if (activeTab === "Candidates" && userType === "promoter" && !hasCreatedEvents) {
      console.log('Tabs: Switching from Candidates to My Events - no events created');
      setActiveTab("My Events");
    }
  }, [activeTab, userType, hasCreatedEvents]);

  // Auto-expand focused event when it's available
  useEffect(() => {
    if (focusedEventId && postedEvents.length > 0) {
      const focusedEvent = postedEvents.find(event => event.id === focusedEventId);
      if (focusedEvent) {
        console.log('Tabs: Auto-expanding focused event:', focusedEvent.title);
        setExpandedEvents(prev => ({ ...prev, [focusedEvent.title]: true }));
      }
    }
  }, [focusedEventId, postedEvents]);

  // Get current user ID and talent count
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
        console.log('Tabs: Current user ID =', user?.id);
        
        // Get user's primary location
        if (user?.id) {
          const primaryLocation = await getUserPrimaryLocation(user.id);
          if (primaryLocation && primaryLocation.city && primaryLocation.state) {
            setUserLocation({
              city: primaryLocation.city,
              state: primaryLocation.state
            });
            console.log('Tabs: User location =', primaryLocation.city, primaryLocation.state);
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setCurrentUserId(null);
      }
    };
    
    const loadTalentCount = async () => {
      try {
        const talents = await getAllTalentUsers();
        setTalentCount(talents.length);
        console.log('Tabs: Talent count =', talents.length);
      } catch (error) {
        console.error('Error loading talent count:', error);
        setTalentCount(0);
      }
    };

    const loadCandidates = async () => {
      if (userType === "promoter" && currentUserId) {
        try {
          const candidatesData = await getCandidatesByPromoter(currentUserId);
          setCandidates(candidatesData);
          console.log('Tabs: Candidates loaded =', candidatesData.length);
          
          // Expand all events by default
          const candidatesByEvent = groupCandidatesByEvent(candidatesData);
          const initialExpandedState: Record<string, boolean> = {};
          Object.keys(candidatesByEvent).forEach(eventTitle => {
            initialExpandedState[eventTitle] = true;
          });
          setExpandedEvents(initialExpandedState);
        } catch (error) {
          console.error('Error loading candidates:', error);
          setCandidates([]);
        }
      }
    };

    const loadApplications = async () => {
      if (userType === "promoter" && currentUserId) {
        try {
          const applicationsData = await getApplicationsWithEventDetails(currentUserId);
          setApplications(applicationsData);
          console.log('Tabs: Applications loaded =', applicationsData.length);
        } catch (error) {
          console.error('Error loading applications:', error);
          setApplications([]);
        }
      }
    };

    getCurrentUser();
    loadTalentCount();
    loadApplications();
  }, []);

  // Load candidates when currentUserId changes
  useEffect(() => {
    const loadCandidates = async () => {
      if (userType === "promoter" && currentUserId) {
        try {
          const candidatesData = await getCandidatesByPromoter(currentUserId);
          setCandidates(candidatesData);
          console.log('Tabs: Candidates loaded =', candidatesData.length);
          
          // Expand all events by default
          const candidatesByEvent = groupCandidatesByEvent(candidatesData);
          const initialExpandedState: Record<string, boolean> = {};
          Object.keys(candidatesByEvent).forEach(eventTitle => {
            initialExpandedState[eventTitle] = true;
          });
          console.log('🔍 Setting expanded events:', initialExpandedState);
          setExpandedEvents(initialExpandedState);
        } catch (error) {
          console.error('Error loading candidates:', error);
          setCandidates([]);
        }
      }
    };

    const loadPastEvents = async () => {
      if (userType === "promoter" && currentUserId) {
        try {
          console.log('🔄 Loading past events for user:', currentUserId);
          const pastEventsData = await getPastEventsWithTrash(currentUserId);
          setPastEvents(pastEventsData);
          console.log('✅ Tabs: Past events loaded =', pastEventsData.length);
        } catch (error) {
          console.error('❌ Error loading past events:', error);
          setPastEvents([]);
        }
      }
    };
    
    loadCandidates();
    loadPastEvents();
  }, [currentUserId, userType]);

  useEffect(() => {
    // Load all posted events from Supabase
    const loadEvents = async () => {
      try {
        // For talents: filter by their location, for promoters: show all posts (no location filter)
        const locationFilter = userType === "talent" ? userLocation : undefined;
        const supabaseEvents = await getAllPostsFromSupabase(locationFilter);
        
        // Use only Supabase events, no sessionStorage fallback to prevent duplicates
        setPostedEvents(supabaseEvents);
        
        // Check if promoter has created events
        if (userType === "promoter" && currentUserId) {
          const promoterEvents = supabaseEvents.filter(event => event.promoterId === currentUserId);
          setHasCreatedEvents(promoterEvents.length > 0);
          console.log('Tabs: Promoter has created events:', promoterEvents.length > 0);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        // Only fallback to sessionStorage if Supabase fails completely
        const events = getAllEvents();
        setPostedEvents(events);
        
        // Check if promoter has created events from session storage
        if (userType === "promoter" && currentUserId) {
          const promoterEvents = events.filter(event => event.promoterId === currentUserId);
          setHasCreatedEvents(promoterEvents.length > 0);
        }
      }
    };
    
    loadEvents();
  }, [currentUserId, userType, userLocation]);

  // Listen for filter changes and post updates
  useEffect(() => {
    const handleStorageChange = async () => {
      try {
        // For talents: filter by their location, for promoters: show all posts (no location filter)
        const locationFilter = userType === "talent" ? userLocation : undefined;
        const supabaseEvents = await getAllPostsFromSupabase(locationFilter);
        const sessionEvents = getAllEvents();
        const allEvents = [...supabaseEvents, ...sessionEvents];
        setPostedEvents(allEvents);
      } catch (error) {
        console.error('Error reloading events:', error);
        const events = getAllEvents();
        setPostedEvents(events);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events (when filters are applied from same tab)
    window.addEventListener('filtersApplied', handleStorageChange);
    // Listen for new posts
    window.addEventListener('postCreated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('filtersApplied', handleStorageChange);
      window.removeEventListener('postCreated', handleStorageChange);
    };
  }, [userType, userLocation]);

  // Filter events based on user type and current user
  const getFilteredEventsByUser = () => {
    if (typeof window === 'undefined') return postedEvents;
    
    // For promoters: show only their own posts (no location filtering)
    if (userType === "promoter" && currentUserId) {
      return postedEvents.filter(event => 
        event.promoterId === currentUserId
      );
    }
    
    // For talents: show all posts from all promoters (already filtered by location in getAllPostsFromSupabase)
    if (userType === "talent") {
      return postedEvents.filter(event => 
        event.promoterId // Only show events that have a promoterId (from Supabase)
      );
    }
    
    // Fallback: return all events
    return postedEvents;
  };

  // Apply filters to events
  const getFilteredEvents = () => {
    if (typeof window === 'undefined') return postedEvents;
    
    // First filter by user type
    let filtered = getFilteredEventsByUser();
    
    // CRITICAL FIX: Filter out events with source: 'trash' (removed events)
    filtered = filtered.filter(event => event.source !== 'trash');
    
    const savedFilters = sessionStorage.getItem('eventFilters');
    if (!savedFilters) return filtered;

    try {
      const filters = JSON.parse(savedFilters);

      // Filter by categories
      if (filters.categories && filters.categories.length > 0) {
        filtered = filtered.filter(event =>
          filters.categories.some((category: string) =>
            event.selectedTalents.includes(category)
          )
        );
      }

      // Filter by time posted
      if (filters.timePosted) {
        const now = new Date();
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.createdAt);
          const diffInHours = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);

          switch (filters.timePosted) {
            case "Just now":
              return diffInHours < 1;
            case "Last 24 hours":
              return diffInHours < 24;
            case "1+ days":
              return diffInHours >= 24 && diffInHours < 168; // 1 week
            case "1 week":
              return diffInHours < 168;
            case "1 month":
              return diffInHours < 720; // 30 days
            case "1+ months":
              return diffInHours >= 720;
            default:
              return true;
          }
        });
      }

      // Filter by distance (mock implementation - in real app would use location data)
      if (filters.distance && filters.distance !== 50) {
        // For now, we'll just return all events since we don't have location data
        // In a real app, you'd calculate distance from user's location to event location
        filtered = filtered;
      }

      return filtered;
    } catch (error) {
      console.error('Error parsing filters:', error);
      return postedEvents;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleViewMoreDetails = (eventId: string) => {
    // Store the selected event data for the detail page
    // Look in both postedEvents (My Events) and pastEvents (Past Events)
    const selectedEvent = postedEvents.find(event => event.id === eventId) || 
                         pastEvents.find(event => event.id === eventId);
    
    console.log('🔍 Looking for event ID:', eventId);
    console.log('📊 Posted Events count:', postedEvents.length);
    console.log('📊 Past Events count:', pastEvents.length);
    console.log('✅ Found event:', selectedEvent);
    
    if (selectedEvent) {
      sessionStorage.setItem('selectedEventData', JSON.stringify(selectedEvent));
      router.push("/eventdetail");
    } else {
      console.error('❌ Event not found in either postedEvents or pastEvents');
    }
  };

  // Restore Event flow
  const onRequestRestoreEvent = (eventId: string, eventTitle: string) => {
    console.log('🔄 onRequestRestoreEvent called for event:', eventId, eventTitle);
    setRestoreModal({ open: true, eventId, eventTitle });
  };

  const finalizeRestoreEvent = async () => {
    if (!restoreModal.eventId) return;
    
    console.log('🚀 FINALIZE RESTORE EVENT STARTED');
    console.log('Event ID:', restoreModal.eventId);
    
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Get the event data from trash
      console.log('📋 Fetching event data from trash...');
      
      // First, check if there are multiple entries for this event
      const { data: allMatchingTrash, error: checkError } = await supabase
        .from('trash')
        .select('*')
        .eq('original_post_id', restoreModal.eventId)
        .eq('removed_by', currentUserId);
      
      console.log('🔍 Found matching trash entries:', allMatchingTrash?.length);
      
      if (checkError) {
        console.error('❌ Error checking trash entries:', checkError);
        setRestoreModal({ open: false, eventId: null, eventTitle: '' });
        return;
      }
      
      if (!allMatchingTrash || allMatchingTrash.length === 0) {
        console.error('❌ No trash entries found for this event');
        setRestoreModal({ open: false, eventId: null, eventTitle: '' });
        return;
      }
      
      // Use the most recent entry if there are duplicates
      const trashEvent = allMatchingTrash.sort((a, b) => 
        new Date(b.removed_at).getTime() - new Date(a.removed_at).getTime()
      )[0];
      
      console.log('✅ Using most recent trash entry from:', trashEvent.removed_at);

      console.log('✅ Trash event found:', trashEvent);
      console.log('📋 Trash event data structure:', JSON.stringify(trashEvent, null, 2));

      // Restore the post to the posts table
      console.log('🔄 Restoring event to posts table...');
      
      // CRITICAL FIX: Modify source field to comply with posts_source_check constraint
      // The constraint only allows 'manual' or 'eventbrite', not 'trash'
      const postDataToRestore = { ...trashEvent.post_data };
      postDataToRestore.source = 'manual'; // Set to valid constraint value
      
      console.log('📋 Modified post data for restore:', JSON.stringify(postDataToRestore, null, 2));
      
      // CRITICAL FIX: Check if post already exists and delete it first to avoid duplicate key error
      console.log('🔍 Checking if post already exists...');
      const { data: existingPost, error: postCheckError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postDataToRestore.id)
        .single();
      
      if (existingPost && !postCheckError) {
        console.log('⚠️ Post already exists, deleting it first...');
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', postDataToRestore.id);
        
        if (deleteError) {
          console.error('❌ Error deleting existing post:', deleteError);
        } else {
          console.log('✅ Existing post deleted successfully');
        }
      } else if (postCheckError && postCheckError.code !== 'PGRST116') {
        console.log('🔍 Post does not exist (expected), proceeding with insert...');
      }
      
      const { data: restoredPost, error: restoreError } = await supabase
        .from('posts')
        .insert(postDataToRestore)
        .select()
        .single();

      console.log('Restore result:', { restoredPost, restoreError });

      if (restoreError) {
        console.error('❌ Error restoring post:', restoreError);
        console.error('❌ Full error details:', JSON.stringify(restoreError, null, 2));
        console.error('❌ Post data being inserted:', JSON.stringify(postDataToRestore, null, 2));
        setRestoreModal({ open: false, eventId: null, eventTitle: '' });
        return;
      }

      // Restore group participants if they exist
      if (trashEvent.participants && trashEvent.participants.length > 0) {
        console.log('👥 Restoring group participants...');
        
        // First, check if participants already exist and delete them to avoid conflicts
        console.log('🧹 Cleaning up any existing participants...');
        const { error: cleanupError } = await supabase
          .from('message_participants')
          .delete()
          .eq('event_id', restoredPost.id);
        
        if (cleanupError) {
          console.log('⚠️ Cleanup warning (might be expected):', cleanupError);
        } else {
          console.log('✅ Existing participants cleaned up');
        }
        
        // Now insert the restored participants
        const { error: participantsError } = await supabase
          .from('message_participants')
          .insert(trashEvent.participants);

        if (participantsError) {
          console.error('❌ Error restoring participants:', participantsError);
        } else {
          console.log('✅ Participants restored successfully');
        }
      }

      // Restore group messages if they exist
      if (trashEvent.group_messages && trashEvent.group_messages.length > 0) {
        console.log('💬 Restoring group messages...');
        
        // First, clean up any existing messages
        console.log('🧹 Cleaning up existing messages...');
        const { error: messagesCleanupError } = await supabase
          .from('messages')
          .delete()
          .eq('event_id', restoredPost.id);
        
        if (messagesCleanupError) {
          console.log('⚠️ Messages cleanup warning (might be expected):', messagesCleanupError);
        } else {
          console.log('✅ Existing messages cleaned up');
        }
        
        const { error: messagesError } = await supabase
          .from('messages')
          .insert(trashEvent.group_messages);

        if (messagesError) {
          console.error('❌ Error restoring messages:', messagesError);
        } else {
          console.log('✅ Messages restored successfully');
        }
      }

      // Restore unified participants if they exist
      if (trashEvent.participants && trashEvent.participants.length > 0) {
        console.log('🔄 Restoring unified participants...');
        
        // First, clean up any existing unified participants
        console.log('🧹 Cleaning up existing unified participants...');
        const { error: unifiedCleanupError } = await supabase
          .from('unified_participants')
          .delete()
          .eq('conversation_id', `group_${restoreModal.eventId}`);
        
        if (unifiedCleanupError) {
          console.log('⚠️ Unified cleanup warning (might be expected):', unifiedCleanupError);
        } else {
          console.log('✅ Existing unified participants cleaned up');
        }
        
        const unifiedParticipants = trashEvent.participants.map((participant: any) => ({
          conversation_id: `group_${restoreModal.eventId}`,
          conversation_type: 'group',
          user_id: participant.user_id
        }));

        const { error: unifiedParticipantsError } = await supabase
          .from('unified_participants')
          .insert(unifiedParticipants);

        if (unifiedParticipantsError) {
          console.error('❌ Error restoring unified participants:', unifiedParticipantsError);
        } else {
          console.log('✅ Unified participants restored successfully');
        }
      }

      // Remove from trash (delete all duplicates)
      console.log('🗑️ Removing from trash...');
      console.log('🗑️ Deleting all trash entries for event:', restoreModal.eventId);
      const { error: deleteTrashError } = await supabase
        .from('trash')
        .delete()
        .eq('original_post_id', restoreModal.eventId)
        .eq('removed_by', currentUserId);

      if (deleteTrashError) {
        console.error('❌ Error removing from trash:', deleteTrashError);
      } else {
        console.log('✅ Event removed from trash');
      }

      // Update UI state immediately
      console.log('🔄 Updating UI state...');
      
      // Add restored event back to My Events (avoid duplicates)
      setPostedEvents(prev => {
        // First, remove any existing event with the same ID to avoid duplicates
        const filteredEvents = prev.filter(event => event.id !== restoredPost.id);
        
        const restoredEvent: EventData = {
          id: restoredPost.id,
          selectedTalents: restoredPost.talents || [],
          selectedWeightClasses: restoredPost.weight_classes || [],
          coverPhoto: restoredPost.cover_photo,
          gigTitle: restoredPost.title,
          gigDescription: restoredPost.description,
          address: restoredPost.location,
          startDate: restoredPost.start_date,
          endDate: restoredPost.end_date,
          startTime: restoredPost.start_time,
          endTime: restoredPost.end_time,
          gigAmount: restoredPost.amount,
          createdAt: restoredPost.created_at,
          status: 'active',
          promoterId: restoredPost.promoter_id,
          source: 'supabase'
        };
        
        const updatedEvents = [restoredEvent, ...filteredEvents];
        console.log('📊 My Events updated - restored event, total count:', updatedEvents.length);
        console.log('📋 My Events IDs after restore:', updatedEvents.map(e => e.id));
        return updatedEvents;
      });

      // Remove from Past Events immediately
      console.log('🗑️ Removing from Past Events...');
      setPastEvents(prev => {
        const updatedPastEvents = prev.filter(event => event.id !== restoreModal.eventId);
        console.log('📊 Past Events updated - removed restored event, remaining count:', updatedPastEvents.length);
        console.log('📋 Remaining past events IDs:', updatedPastEvents.map(e => e.id));
        return updatedPastEvents;
      });

      // Dispatch events to refresh other parts of UI
      window.dispatchEvent(new Event('postUpdated'));
      window.dispatchEvent(new Event('unifiedMessageSent'));

      // Switch to My Events tab
      setActiveTab('My Events');

      setRestoreModal({ open: false, eventId: null, eventTitle: '' });
      
      console.log('✅ Event restored successfully!');
      
    } catch (e) {
      console.error('❌ Restore event failed:', e);
      setRestoreModal({ open: false, eventId: null, eventTitle: '' });
    }
  };

  // End Event flow
  const onRequestEndEvent = async (eventId: string) => {
    console.log('🔍 onRequestEndEvent called for event:', eventId);
    
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Count group participants for this event (exclude promoter later in message)
      console.log('📋 Fetching event data...');
      const { data: eventRow, error: eventError } = await supabase
        .from('posts')
        .select('promoter_id, id')
        .eq('id', eventId)
        .single();

      console.log('Event data result:', { eventRow, eventError });

      console.log('👥 Fetching group members...');
      const { data: groupMembers, error: groupError } = await supabase
        .from('message_participants')
        .select('user_id')
        .eq('event_id', eventId);

      console.log('Group members result:', { groupMembers, groupError });

      const participantIds = (groupMembers || []).map(m => m.user_id);
      const hasOthers = eventRow?.promoter_id
        ? participantIds.some(id => id !== eventRow.promoter_id)
        : participantIds.length > 0;

      console.log('Participant analysis:', { participantIds, hasOthers });

      const confirmMsg = hasOthers
        ? 'You created a group with participants. Are you sure you want to end this event?'
        : 'Are you sure you want to remove this event?';

      console.log('📝 Modal message:', confirmMsg);
      setEndModal({ open: true, eventId, message: confirmMsg });
    } catch (e) {
      console.error('❌ End event flow failed:', e);
    }
  };

  const finalizeEndEvent = async () => {
    if (!endModal.eventId) return;
    
    console.log('🚀 FINALIZE END EVENT STARTED');
    console.log('Event ID:', endModal.eventId);
    
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Get event title before deletion for notifications
      console.log('📋 Fetching event data...');
      const { data: eventData, error: eventDataError } = await supabase
        .from('posts')
        .select('title')
        .eq('id', endModal.eventId)
        .single();
      
      console.log('Event data result:', { eventData, eventDataError });
      const eventTitle = eventData?.title || 'Event';
      console.log('Event title:', eventTitle);

      // Get all participants in the group chat for this event
      console.log('👥 Fetching participants...');
      const { data: participants, error: participantsError } = await supabase
        .from('message_participants')
        .select('user_id')
        .eq('event_id', endModal.eventId);

      console.log('Participants result:', { participants, participantsError });

      // Create notifications for all participants about event removal
      if (participants && participants.length > 0) {
        console.log('📧 Creating notifications for', participants.length, 'participants');
        const notifications = participants.map(participant => ({
          user_id: participant.user_id,
          type: 'event_posted', // Reuse existing type
          title: 'Event Removed',
          message: `The group chat for "${eventTitle}" has been removed. Click "Restore" in Past Events to restore it.`,
          button_text: 'View Past Events',
          icon: '🗑️',
          is_read: false,
          conversation_id: `group_${endModal.eventId}`,
          conversation_type: 'group'
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        console.log('Notification insert result:', { notificationError });
      } else {
        console.log('No participants found for notifications');
      }

      // Get current user ID for trash record
      console.log('👤 Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      console.log('Current user ID:', currentUserId);

      // Try to move post to trash using the database function
      console.log('🗑️ Attempting to move post to trash...');
      console.log('Parameters:', { post_id_param: endModal.eventId, removed_by_param: currentUserId });
      
      let trashSuccess = false;
      try {
        const { data: trashResult, error: trashError } = await supabase
          .rpc('move_post_to_trash', {
            post_id_param: endModal.eventId,
            removed_by_param: currentUserId
          });

        console.log('Trash RPC result:', { trashResult, trashError });

        if (trashError) {
          console.error('❌ Error moving post to trash:', trashError);
          console.error('Error details:', {
            code: trashError.code,
            message: trashError.message,
            details: trashError.details,
            hint: trashError.hint
          });
        } else {
          console.log('✅ Post successfully moved to trash:', trashResult);
          trashSuccess = true;
        }
      } catch (rpcError) {
        console.log('⚠️ RPC function error:', rpcError);
        console.log('RPC error details:', {
          name: rpcError.name,
          message: rpcError.message,
          stack: rpcError.stack
        });
      }

      // Fallback: manually create trash entry if RPC function fails
      if (!trashSuccess) {
        console.log('🔄 Using manual trash creation method...');
        
        // Get the post data before moving to trash
        console.log('📋 Fetching post data for trash...');
        const { data: postToTrash, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', endModal.eventId)
          .single();

        console.log('Post to trash:', { postToTrash, fetchError });

        if (fetchError || !postToTrash) {
          console.error('❌ Error fetching post for trash:', fetchError);
          return;
        }

        // Get group messages for this event
        const { data: groupMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('event_id', endModal.eventId);

        // Get group participants for this event
        const { data: groupParticipants } = await supabase
          .from('message_participants')
          .select('*')
          .eq('event_id', endModal.eventId);

        // Manually insert into trash table
        console.log('🗑️ Manually creating trash entry...');
        const { data: trashEntry, error: trashInsertError } = await supabase
          .from('trash')
          .insert({
            original_post_id: endModal.eventId,
            post_data: postToTrash,
            group_messages: groupMessages || [],
            participants: groupParticipants || [],
            removed_by: currentUserId,
            reason: 'Event ended by promoter'
          })
          .select()
          .single();

        console.log('Trash insert result:', { trashEntry, trashInsertError });

        if (trashInsertError) {
          console.error('❌ Error creating trash entry:', trashInsertError);
          return;
        }

        // Clean up all related data from active tables
        console.log('🧹 Cleaning up related data...');
        
        // Delete from messages table (group chat messages)
        const { error: messagesDeleteError } = await supabase
          .from('messages')
          .delete()
          .eq('event_id', endModal.eventId);
        
        console.log('Messages delete result:', { messagesDeleteError });
        
        // Delete from message_participants table (group chat participants)
        const { error: participantsDeleteError } = await supabase
          .from('message_participants')
          .delete()
          .eq('event_id', endModal.eventId);
        
        console.log('Participants delete result:', { participantsDeleteError });
        
        // Delete from unified_participants table (unified messaging system)
        const { error: unifiedDeleteError } = await supabase
          .from('unified_participants')
          .delete()
          .eq('conversation_id', `group_${endModal.eventId}`);
        
        console.log('Unified participants delete result:', { unifiedDeleteError });
        
        // Delete from unified_messages table (unified messaging system)
        const { error: unifiedMessagesDeleteError } = await supabase
          .from('unified_messages')
          .delete()
          .eq('conversation_id', `group_${endModal.eventId}`);
        
        console.log('Unified messages delete result:', { unifiedMessagesDeleteError });

        // Now delete the original post
        console.log('🗑️ Deleting original post...');
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', endModal.eventId);
        
        console.log('Post delete result:', { deleteError });
        
        if (deleteError) {
          console.error('❌ Error deleting original post:', deleteError);
        } else {
          console.log('✅ Post and all related data moved to trash successfully');
        }
      }

      // Update local cache and refresh UI
      try {
        console.log('🔄 Dispatching events to refresh UI...');
        
        // Dispatch events to refresh different parts of the UI
        window.dispatchEvent(new Event('postUpdated')); // Refresh My Events
        window.dispatchEvent(new Event('unifiedMessageSent')); // Refresh Messages page
        window.dispatchEvent(new Event('messageRead')); // Refresh message badges
        
        // Update sessionStorage to remove the event from cached data
        try {
          const cachedEvents = JSON.parse(sessionStorage.getItem('postedEvents') || '[]');
          const updatedEvents = cachedEvents.filter((event: any) => event.id !== endModal.eventId);
          sessionStorage.setItem('postedEvents', JSON.stringify(updatedEvents));
          console.log('✅ Removed event from cached data');
        } catch (cacheError) {
          console.log('⚠️ Could not update sessionStorage cache:', cacheError);
        }
        
      } catch (eventError) {
        console.error('❌ Error dispatching refresh events:', eventError);
      }

      setEndModal({ open: false, eventId: null, message: '' });
      
      // Update the postedEvents state to remove the ended event immediately
      console.log('🔄 Updating My Events list...');
      setPostedEvents(prev => {
        const updatedEvents = prev.filter(event => event.id !== endModal.eventId);
        console.log('📊 My Events updated - removed event, remaining count:', updatedEvents.length);
        return updatedEvents;
      });
      
      // Reload past events to show the removed event
      console.log('🔄 Reloading past events...');
      if (currentUserId) {
        try {
          const pastEventsData = await getPastEventsWithTrash(currentUserId);
          console.log('📊 Past events from database:', pastEventsData.length);
          setPastEvents(pastEventsData);
          console.log('✅ Past events reloaded after end event:', pastEventsData.length);
        } catch (error) {
          console.error('❌ Error reloading past events:', error);
        }
      }
      
      // Dispatch custom event to notify messages page about group chat removal
      console.log('📢 Notifying messages page about group chat removal...');
      window.dispatchEvent(new CustomEvent('groupChatRemoved', {
        detail: {
          eventId: endModal.eventId,
          eventTitle: eventTitle,
          message: `The group chat for "${eventTitle}" has been removed. Click "Restore" in Past Events to restore it.`
        }
      }));
      
      console.log('🔄 Switching to Past Events tab...');
      // Switch to Past Events tab to show the removed event
      setActiveTab('Past Events');
      
      console.log('🔄 Refreshing page...');
      // Refresh the page to avoid 406 errors and ensure UI is updated
      window.location.reload();
    } catch (e) {
      console.error('Finalize end event failed:', e);
      setEndModal({ open: false, eventId: null, message: '' });
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderCandidateCard = (candidate: Candidate) => (
    <div key={candidate.id} className="bg-surface rounded-xl p-4 mb-3 shadow-sm border border-text-secondary">
      <div className="flex items-center space-x-4">
        {/* Candidate Profile Image */}
        {candidate.talent_image_url ? (
          <img 
            src={candidate.talent_image_url} 
            alt={candidate.talent_name} 
            className="w-12 h-12 rounded-full object-cover flex-shrink-0" 
          />
        ) : (
          <div className="w-12 h-12 bg-input-background rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-base mb-1 truncate">
            {candidate.talent_name || 'Unknown Talent'}
          </h3>
          <p className="text-text-secondary text-sm">
            {candidate.talent_categories?.join(", ") || 'No categories'}
          </p>
          {candidate.talent_location && (
            <p className="text-text-secondary text-xs mt-1">
              {candidate.talent_location}
            </p>
          )}
          {/* Show promoter name if available */}
          {candidate.promoter_name && (
            <p className="text-text-secondary text-xs mt-1">
              Promoter: {candidate.promoter_name}
            </p>
          )}
        </div>

        {/* Offer Amount and Status */}
        <div className="text-right">
          <p className="text-green-600 font-bold text-lg">
            ${candidate.offer_amount || '0'}
          </p>
          <p className="text-text-secondary text-xs capitalize">
            {candidate.status}
          </p>
        </div>
      </div>
    </div>
  );

  const renderEventCard = (event: EventData, listType: string = 'default') => (
    <div key={`${listType}-${event.id}`} className="bg-surface rounded-xl overflow-hidden shadow-lg mb-4">
      {/* Event Photo */}
      {event.coverPhoto && (
        <div className="relative">
          <img 
            src={event.coverPhoto} 
            alt="Event cover" 
            className="w-full h-48 object-cover"
          />
          {/* Tags */}
          <div className="absolute top-3 left-3">
            <span className="bg-surface text-text-primary px-2 py-1 rounded-full text-xs font-medium">
              {getTimeAgo(event.createdAt)}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex space-x-2">
            <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
            <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Event Details */}
      <div className="p-4">
        {/* Category Tag */}
        <div className="mb-2">
          <span className="bg-input-background text-text-primary px-2 py-1 rounded-full text-xs font-medium">
            {event.selectedTalents[0] || "Event"}
          </span>
        </div>

        {/* Gig Title */}
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {event.gigTitle}
          {event.source === 'trash' && (
            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Removed
            </span>
          )}
        </h2>

        {/* Date and Time */}
        <p className="text-text-secondary text-sm mb-1">
          {formatDate(event.startDate)} {event.startTime} - {event.endTime}
        </p>

        {/* Address */}
        <p className="text-text-secondary text-sm mb-2">
          {event.address}
        </p>

        {/* Distance */}
        <p className="text-text-secondary text-sm mb-3">
          0.0 miles away
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {event.source === 'trash' ? (
            <>
              <button
                onClick={() => handleViewMoreDetails(event.id)}
                className="bg-button-red hover:bg-button-red-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View more details
              </button>
              {userType === 'promoter' && (
                <button
                  onClick={() => onRequestRestoreEvent(event.id, event.gigTitle)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Restore
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => handleViewMoreDetails(event.id)}
                className="bg-button-red hover:bg-button-red-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View more details
              </button>
              {userType === 'promoter' && (
                <button
                  onClick={() => onRequestEndEvent(event.id)}
                  className="bg-surface text-text-primary border border-text-secondary hover:bg-input-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  End event
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "Events":
        const filteredActiveEvents = getFilteredEvents().filter(event => event.status === 'active');
        if (filteredActiveEvents.length > 0) {
          return (
            <div className="p-4">
              {filteredActiveEvents.map((event) => renderEventCard(event, 'active-events'))}
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-text-primary font-bold text-lg mb-2">No events yet</h3>
              <p className="text-text-secondary text-sm text-center">Available events will appear here.</p>
            </div>
          );
        }
      case "My Events":
        const filteredMyEvents = getFilteredEvents().filter(event => event.status === 'active');
        if (filteredMyEvents.length > 0) {
          return (
            <div className="p-4">
              {filteredMyEvents.map((event) => renderEventCard(event, 'my-events'))}
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-text-primary font-bold text-lg mb-2">No gigs yet</h3>
              <p className="text-text-secondary text-sm text-center">Create an event to see your posts here.</p>
            </div>
          );
        }
      case "Candidates":
        // Check if promoter has created events first
        if (!hasCreatedEvents) {
          return (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-text-primary font-bold text-lg mb-2">Create an Event First</h3>
              <p className="text-text-secondary text-sm text-center mb-6">You need to create an event before you can receive candidates.</p>
              <button
                onClick={() => router.push("/create")}
                className="bg-button-red hover:bg-button-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Create Event
              </button>
            </div>
          );
        }
        
        // Always show events, even if no candidates yet
        {
          const candidatesByEvent = groupCandidatesByEvent(candidates);
          
          // If we have a focused event, show it first and expanded
          const focusedEvent = focusedEventId ? postedEvents.find(event => event.id === focusedEventId) : null;
          const focusedEventTitle = focusedEvent?.title;
          const focusedEventCandidates = focusedEventTitle ? candidatesByEvent[focusedEventTitle] : null;
          
          return (
            <div className="p-4">
              {/* Group events title */}
              <h2 className="text-text-primary font-bold text-xl mb-4">Group events</h2>
              
              {/* Show focused event first if it exists */}
              {focusedEventCandidates && (
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-green-800 text-sm font-medium">🎉 New candidate accepted!</p>
                  </div>
                  <div className="bg-surface border border-text-secondary rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-left">
                        <h3 className="text-text-primary font-bold text-base">{focusedEventTitle}</h3>
                        <p className="text-text-secondary text-sm">
                          {focusedEventCandidates.filter(c => c.status === 'accepted').length} accepted • {focusedEventCandidates.filter(c => c.status === 'pending').length} pending
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-text-primary transition-transform ${expandedEvents[focusedEventTitle] ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20" fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                      </svg>
                    </div>
                    
                    {/* Auto-expand focused event */}
                    {expandedEvents[focusedEventTitle] && (
                      <div className="space-y-3">
                        {focusedEventCandidates.map((candidate) => (
                          <div key={candidate.id} className="bg-background border border-text-secondary rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-button-red rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {candidate.talent_name?.charAt(0) || 'T'}
                                </div>
                                <div>
                                  <h4 className="text-text-primary font-medium">{candidate.talent_name || 'Unknown Talent'}</h4>
                                  <p className="text-text-secondary text-sm">{candidate.talent_email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  candidate.status === 'accepted' 
                                    ? 'bg-green-100 text-green-800' 
                                    : candidate.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {candidate.status}
                                </div>
                                {candidate.status === 'accepted' && candidate.offer_amount && (
                                  <p className="text-text-primary font-bold text-sm mt-1">${candidate.offer_amount}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Show all events (with or without candidates) - only for current promoter */}
              {postedEvents
                .filter(event => event.promoterId === currentUserId) // Only show current promoter's events
                .map((event) => {
                const eventCandidates = candidatesByEvent[event.gigTitle] || [];
                const isFocusedEvent = focusedEventTitle && event.gigTitle === focusedEventTitle;
                
                // Skip the focused event as it's already shown above
                if (isFocusedEvent) return null;
                
                console.log('🔍 Rendering event:', {
                  id: event.id,
                  title: event.gigTitle,
                  promoterId: event.promoterId,
                  currentUserId,
                  candidatesCount: eventCandidates.length
                });
                
                return (
                  <div key={event.id} className="mb-4">
                    {/* Event Header - Accordion */}
                    <div className="bg-surface border border-text-secondary rounded-lg p-3">
                      {/* Event Header - Clickable for expand/collapse */}
                      <button
                        onClick={() => toggleEventExpanded(event.gigTitle)}
                        className="w-full flex items-center justify-between mb-3"
                      >
                        <div className="text-left">
                          <h3 className="text-text-primary font-bold text-base">
                            {event.gigTitle || 'Untitled Event'}
                          </h3>
                          <p className="text-text-secondary text-sm">
                            {eventCandidates.filter(c => c.status === 'accepted').length} accepted • {eventCandidates.filter(c => c.status === 'pending').length} pending
                          </p>
                          {/* Show promoter info with fallback */}
                          <p className="text-text-secondary text-xs mt-1">
                            By {event.promoterName || event.promoterEmail || 'Unknown Promoter'}
                          </p>
                        </div>
                        <svg
                          className={`w-5 h-5 text-text-primary transition-transform ${expandedEvents[event.gigTitle] ? 'rotate-180' : ''}`}
                          viewBox="0 0 20 20" fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Invite More Talent CTA */}
                      <button
                        onClick={() => router.push("/promotertalentlist")}
                        className="w-full bg-button-red hover:bg-button-red-hover text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Invite More Talent</span>
                      </button>
                    </div>

                    {/* Candidates for this event (collapsible) */}
                    {(() => {
                      const isExpanded = expandedEvents[event.gigTitle];
                      console.log(`🔍 Event "${event.gigTitle}" expanded state:`, isExpanded);
                      return isExpanded && (
                        <div className="space-y-2 mt-2">
                          {eventCandidates.length > 0 ? (
                            eventCandidates.map(renderCandidateCard)
                          ) : (
                            <div className="bg-background border border-text-secondary rounded-lg p-4 text-center">
                              <p className="text-text-secondary text-sm">No candidates yet</p>
                              <p className="text-text-secondary text-xs mt-1">Send offers to talent to see accepted candidates here</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
              
              {/* Show message if no events at all */}
              {postedEvents.length === 0 && (
                <div className="mb-4">
                  <div className="bg-surface border border-text-secondary rounded-lg p-3">
                    <div className="text-center">
                      <h3 className="text-text-primary font-bold text-lg mb-2">No Events Yet</h3>
                      <p className="text-text-secondary text-sm mb-4">
                        Create your first event to start inviting talent.
                      </p>
                      <button
                        onClick={() => router.push("/createevent")}
                        className="bg-button-red hover:bg-button-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                      >
                        Create Event
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
      case "Past Events":
        console.log('📊 Past Events tab rendering - count:', pastEvents.length);
        console.log('📋 Past events data:', pastEvents);
        
        if (pastEvents.length > 0) {
          return (
            <div className="p-4 space-y-4">
              {pastEvents.map((event) => renderEventCard(event, 'past-events'))}
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-text-primary font-bold text-lg mb-2">No past events</h3>
              <p className="text-text-secondary text-sm text-center">Your completed and removed events will appear here.</p>
            </div>
          );
        }
      default:
        return null;
    }
  };

  // Don't render tabs while userType is being determined
  if (!userType) {
    return (
      <div className="bg-background">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Tab Navigation */}
      <div className="flex border-b border-text-secondary">
        {tabs.map((tab) => {
          const isDisabled = tab === "Candidates" && userType === "promoter" && !hasCreatedEvents;
          return (
            <button
              key={tab}
              onClick={() => !isDisabled && setActiveTab(tab)}
              disabled={isDisabled}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                isDisabled
                  ? "text-text-secondary opacity-50 cursor-not-allowed"
                  : activeTab === tab
                  ? "text-button-red border-b-2 border-button-red"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative">
        {renderContent()}

        {/* End Event Modal */}
        {endModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setEndModal({ open: false, eventId: null, message: '' })}></div>
            <div className="relative bg-surface border border-text-secondary rounded-xl p-5 w-11/12 max-w-sm mx-auto">
              <h3 className="text-text-primary font-bold text-lg mb-2">Confirm</h3>
              <p className="text-text-secondary text-sm mb-4">{endModal.message}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setEndModal({ open: false, eventId: null, message: '' })}
                  className="w-full bg-surface text-text-primary border border-text-secondary px-4 py-3 rounded-lg text-sm font-medium"
                >
                  No
                </button>
                <button
                  onClick={finalizeEndEvent}
                  className="w-full bg-button-red hover:bg-button-red-hover text-white px-4 py-3 rounded-lg text-sm font-medium"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restore Event Confirmation Modal */}
        {restoreModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setRestoreModal({ open: false, eventId: null, eventTitle: '' })} />
            <div className="relative bg-surface border border-text-secondary rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Restore Event
              </h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to restore "{restoreModal.eventTitle}"? 
                This will move it back to your active events and restore its group chat.
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={finalizeRestoreEvent}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Yes, Restore
                </button>
                <button
                  onClick={() => setRestoreModal({ open: false, eventId: null, eventTitle: '' })}
                  className="bg-input-background hover:bg-text-secondary text-text-primary px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
