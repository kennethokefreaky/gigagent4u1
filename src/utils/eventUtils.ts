export interface EventData {
  id: string;
  selectedTalents: string[];
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
