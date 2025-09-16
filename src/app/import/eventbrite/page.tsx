"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
  };
  summary?: string;
  start: {
    utc: string;
    local: string;
  };
  end: {
    utc: string;
    local: string;
  };
  venue?: {
    address: {
      localized_address_display: string;
    };
  };
  logo?: {
    url: string;
  };
}

interface EventData {
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
}

export default function ImportEventbritePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [allEvents, setAllEvents] = useState<EventbriteEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventbriteEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = () => {
    router.push("/addevent");
  };

  // Fetch events from organization on component mount
  const fetchOrganizationEvents = async () => {
    setIsLoading(true);
    setError("");

    try {
      const orgId = process.env.NEXT_PUBLIC_EVENTBRITE_ORG_ID;
      const token = process.env.NEXT_PUBLIC_EVENTBRITE_TOKEN;
      
      if (!orgId || !token) {
        throw new Error("Eventbrite configuration missing. Please check your environment variables.");
      }

      const response = await fetch(
        `https://www.eventbriteapi.com/v3/organizations/${orgId}/events/?expand=venue,logo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data = await response.json();
      setAllEvents(data.events || []);
      setFilteredEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching Eventbrite events:", err);
      setError("Failed to fetch events. Please try again.");
      setAllEvents([]);
      setFilteredEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side search filtering
  const filterEvents = (query: string) => {
    if (!query.trim()) {
      setFilteredEvents(allEvents);
      return;
    }

    const filtered = allEvents.filter(event =>
      event.name.text.toLowerCase().includes(query.toLowerCase()) ||
      (event.summary && event.summary.toLowerCase().includes(query.toLowerCase())) ||
      (event.venue?.address?.localized_address_display && 
       event.venue.address.localized_address_display.toLowerCase().includes(query.toLowerCase()))
    );
    
    setFilteredEvents(filtered);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      filterEvents(value);
    }, 300);
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleImportSelected = () => {
    if (selectedEvents.length === 0) {
      setError("Please select at least one event to import.");
      return;
    }

    // Get the first selected event
    const selectedEvent = filteredEvents.find(event => event.id === selectedEvents[0]);
    if (!selectedEvent) {
      setError("Selected event not found.");
      return;
    }

    // Map Eventbrite event to our normalized EventData format
    const mappedEvent: EventData = {
      selectedTalents: [],
      selectedWeightClasses: [],
      coverPhoto: selectedEvent.logo?.url || null,
      gigTitle: selectedEvent.name?.text || "",
      gigDescription: selectedEvent.summary || "",
      address: selectedEvent.venue?.address?.localized_address_display || "No address provided",
      startDate: selectedEvent.start?.utc || "",
      endDate: selectedEvent.end?.utc || "",
      startTime: selectedEvent.start?.utc ? new Date(selectedEvent.start.utc).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }) : "",
      endTime: selectedEvent.end?.utc ? new Date(selectedEvent.end.utc).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }) : "",
      gigAmount: ""
    };

    // Save to sessionStorage
    sessionStorage.setItem("eventData", JSON.stringify(mappedEvent));
    
    // Redirect to postpreview
    router.push("/postpreview");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchOrganizationEvents();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-text-secondary">
        <button
          onClick={handleClose}
          className="p-2 hover:bg-surface rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-heading font-bold text-center flex-1 mr-10">
          Import from Eventbrite
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search your events..."
              className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-button-red"
            />
          </div>
          {searchQuery.length > 0 && (
            <p className="text-text-secondary text-sm mt-2">
              Showing {filteredEvents.length} of {allEvents.length} events
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading your events...</p>
          </div>
        )}

        {/* Error Message */}
        {error && !isLoading && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Events List */}
        {!isLoading && filteredEvents.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-subheading font-semibold text-text-primary">
              {searchQuery ? `Found ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}` : `Your Events (${filteredEvents.length})`}
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`bg-surface border rounded-xl p-4 cursor-pointer transition-colors ${
                    selectedEvents.includes(event.id)
                      ? 'border-button-red bg-button-red bg-opacity-10'
                      : 'border-text-secondary hover:border-button-red'
                  }`}
                  onClick={() => handleEventSelect(event.id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Event Image */}
                    <div className="w-16 h-16 bg-input-background rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {event.logo?.url ? (
                        <img
                          src={event.logo.url}
                          alt="Event"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-text-primary font-semibold text-sm mb-1 line-clamp-2">
                        {event.name.text}
                      </h4>
                      
                      <div className="space-y-1 text-xs text-text-secondary">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(event.start.local)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTime(event.start.local)} - {formatTime(event.end.local)}</span>
                        </div>
                        
                        {event.venue?.address?.localized_address_display && (
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{event.venue.address.localized_address_display}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection Checkbox */}
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedEvents.includes(event.id)
                          ? 'bg-button-red border-button-red'
                          : 'border-text-secondary'
                      }`}>
                        {selectedEvents.includes(event.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Button */}
        {selectedEvents.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-text-secondary p-4">
            <button
              onClick={handleImportSelected}
              className="w-full bg-button-red hover:bg-button-red-hover text-white py-3 px-6 rounded-xl font-semibold transition-colors"
            >
              Import Selected Event{selectedEvents.length > 1 ? 's' : ''} ({selectedEvents.length})
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (
          <>
            {allEvents.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-text-secondary">No events found in your organization</p>
                <p className="text-text-secondary text-sm mt-1">Create events in Eventbrite to import them here</p>
              </div>
            )}
            
            {allEvents.length > 0 && filteredEvents.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-text-secondary">No events found for "{searchQuery}"</p>
                <p className="text-text-secondary text-sm mt-1">Try a different search term</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}