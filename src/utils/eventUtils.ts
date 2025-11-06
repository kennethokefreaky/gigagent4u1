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
  promoterName?: string; // Added for promoter name with fallback
  promoterEmail?: string; // Added for promoter email
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
export const getAllPostsFromSupabase = async (userLocation?: { city: string; state: string }): Promise<EventData[]> => {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_promoter_id_fkey(
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // If user location is provided, filter posts by location
    if (userLocation) {
      // Filter by city and state in the location field
      query = query.or(`location.ilike.%${userLocation.city}%,location.ilike.%${userLocation.state}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts from Supabase:', error);
      return [];
    }

    // Convert Supabase posts to EventData format with promoter fallbacks
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
      promoterName: post.profiles?.full_name || post.profiles?.email || 'Unknown Promoter',
      promoterEmail: post.profiles?.email || 'Unknown Email',
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
  email?: string; // Make email optional since it might not always be present
  full_name?: string; // Add full_name field
  location?: string; // Add location field for talent users
  profile_image_url?: string; // Add profile_image_url field
  talent_categories: string[];
  verification_status: string;
  created_at: string;
  updated_at: string;
}

// Function to fetch all talent users from Supabase
export const getAllTalentUsers = async (): Promise<TalentUser[]> => {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    console.log('getAllTalentUsers: Starting to fetch talent users...');
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('getAllTalentUsers: Current user:', user);
    console.log('getAllTalentUsers: Auth error:', authError);
    
    // First, let's test if we can query the profiles table at all
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, role, full_name, location, profile_image_url, talent_categories')
      .limit(5);
    
    console.log('getAllTalentUsers: Test query for all profiles:', { allProfiles, allProfilesError });
    console.log('getAllTalentUsers: All profiles error details:', JSON.stringify(allProfilesError, null, 2));
    
    // Test if we can query just the basic structure
    const { data: basicTest, error: basicError } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1);
    
    console.log('getAllTalentUsers: Basic test query:', { basicTest, basicError });
    console.log('getAllTalentUsers: Basic error details:', JSON.stringify(basicError, null, 2));
    
    // Test if location column now exists
    const { data: locationTest, error: locationError } = await supabase
      .from('profiles')
      .select('id, location')
      .limit(1);
    
    console.log('getAllTalentUsers: Location column test:', { locationTest, locationError });
    console.log('getAllTalentUsers: Location error details:', JSON.stringify(locationError, null, 2));
    
    // Now query for talent users specifically - simplified query without join for now
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        email,
        full_name, 
        location, 
        profile_image_url, 
        talent_categories, 
        verification_status, 
        created_at, 
        updated_at
      `)
      .eq('role', 'talent')
      .order('created_at', { ascending: false });

    console.log('getAllTalentUsers: Supabase query result:', { data, error });
    console.log('getAllTalentUsers: Error details:', JSON.stringify(error, null, 2));

    if (error) {
      console.error('Error fetching talent users from Supabase:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return [];
    }

    console.log('getAllTalentUsers: Returning data:', data);
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
