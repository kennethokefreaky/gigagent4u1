export interface EventData {
  id: string;
  selectedTalents: string[];
  selectedWeightClasses: string[];
  coverPhoto: string | null;
  gigTitle: string;
  gigDescription: string;
  address: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  gigAmount: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
  promoterId?: string; // Added for Supabase posts
  source?: string; // Added for Supabase posts
}

export const generateEventId = (): string => {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveEvent = (event: Omit<EventData, 'id' | 'createdAt' | 'status'>): EventData => {
  const newEvent: EventData = {
    ...event,
    id: generateEventId(),
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  // Get existing events from sessionStorage
  const existingEvents = sessionStorage.getItem('postedEvents');
  let events: EventData[] = [];
  
  if (existingEvents) {
    try {
      events = JSON.parse(existingEvents);
    } catch (error) {
      console.error('Error parsing existing events:', error);
      events = [];
    }
  }

  // Add new event to the beginning of array (most recent first)
  events.unshift(newEvent);

  // Save updated events array
  sessionStorage.setItem('postedEvents', JSON.stringify(events));
  
  // Keep the legacy single event data for backward compatibility
  sessionStorage.setItem('eventData', JSON.stringify(newEvent));
  sessionStorage.setItem('firstEventPosted', 'true');

  return newEvent;
};

export const getAllEvents = (): EventData[] => {
  const savedEvents = sessionStorage.getItem('postedEvents');
  if (savedEvents) {
    try {
      return JSON.parse(savedEvents);
    } catch (error) {
      console.error('Error parsing saved events:', error);
      return [];
    }
  }
  return [];
};

// New function to fetch posts from Supabase
export const getAllPostsFromSupabase = async (): Promise<EventData[]> => {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts from Supabase:', error);
      return [];
    }

    // Convert Supabase posts to EventData format
    return data.map(post => ({
      id: post.id,
      selectedTalents: post.talents || [],
      selectedWeightClasses: post.weight_classes || [],
      coverPhoto: post.cover_photo,
      gigTitle: post.title,
      gigDescription: post.description,
      address: post.location,
      startDate: post.start_date,
      endDate: post.end_date,
      startTime: post.start_time,
      endTime: post.end_time,
      gigAmount: post.amount,
      createdAt: post.created_at,
      status: 'active' as const,
      promoterId: post.promoter_id,
      source: post.source
    }));
  } catch (error) {
    console.error('Error importing Supabase client:', error);
    return [];
  }
};

// Interface for talent user data
export interface TalentUser {
  id: string;
  email: string;
  talent_categories: string[];
  verification_status: string;
  created_at: string;
  updated_at: string;
}

// Function to fetch all talent users from Supabase
export const getAllTalentUsers = async (): Promise<TalentUser[]> => {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'talent')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching talent users from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error importing Supabase client:', error);
    return [];
  }
};

export const getActiveEvents = (): EventData[] => {
  return getAllEvents().filter(event => event.status === 'active');
};

export const getPastEvents = (): EventData[] => {
  return getAllEvents().filter(event => event.status === 'completed' || event.status === 'cancelled');
};

export const updateEventStatus = (eventId: string, status: EventData['status']): boolean => {
  const events = getAllEvents();
  const eventIndex = events.findIndex(event => event.id === eventId);
  
  if (eventIndex !== -1) {
    events[eventIndex].status = status;
    sessionStorage.setItem('postedEvents', JSON.stringify(events));
    return true;
  }
  
  return false;
};

export const deleteEvent = (eventId: string): boolean => {
  const events = getAllEvents();
  const filteredEvents = events.filter(event => event.id !== eventId);
  
  if (filteredEvents.length !== events.length) {
    sessionStorage.setItem('postedEvents', JSON.stringify(filteredEvents));
    return true;
  }
  
  return false;
};
