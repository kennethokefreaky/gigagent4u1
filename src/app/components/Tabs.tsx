"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EventData, getAllEvents, getActiveEvents, getPastEvents } from "../../utils/eventUtils";

type TabType = "My Events" | "Candidates" | "Past Events" | "Events" | "Past Events";

interface TabsProps {
  userType: string;
}

export default function Tabs({ userType }: TabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(userType === "promoter" ? "My Events" : "Events");
  const [postedEvents, setPostedEvents] = useState<EventData[]>([]);

  // Debug: Log the userType and activeTab
  console.log('Tabs: userType =', userType);
  console.log('Tabs: activeTab =', activeTab);

  const tabs: TabType[] = userType === "promoter" 
    ? ["My Events", "Candidates", "Past Events"] 
    : ["Events", "Past Events"];

  // Ensure activeTab is set correctly when userType changes
  useEffect(() => {
    const correctActiveTab = userType === "promoter" ? "My Events" : "Events";
    console.log('Tabs: Setting activeTab to =', correctActiveTab);
    setActiveTab(correctActiveTab);
  }, [userType]);

  useEffect(() => {
    // Load all posted events using utility function
    const events = getAllEvents();
    setPostedEvents(events);
  }, []);

  // Listen for filter changes
  useEffect(() => {
    const handleStorageChange = () => {
      const events = getAllEvents();
      setPostedEvents(events);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events (when filters are applied from same tab)
    window.addEventListener('filtersApplied', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('filtersApplied', handleStorageChange);
    };
  }, []);

  // Apply filters to events
  const getFilteredEvents = () => {
    if (typeof window === 'undefined') return postedEvents;
    const savedFilters = sessionStorage.getItem('eventFilters');
    if (!savedFilters) return postedEvents;

    try {
      const filters = JSON.parse(savedFilters);
      let filtered = postedEvents;

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
    const selectedEvent = postedEvents.find(event => event.id === eventId);
    if (selectedEvent) {
      sessionStorage.setItem('selectedEventData', JSON.stringify(selectedEvent));
      router.push("/eventdetail");
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

  const renderEventCard = (event: EventData) => (
    <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-lg mb-4">
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
            <span className="bg-white text-black px-2 py-1 rounded-full text-xs font-medium">
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
          <span className="bg-gray-100 text-black px-2 py-1 rounded-full text-xs font-medium">
            {event.selectedTalents[0] || "Event"}
          </span>
        </div>

        {/* Gig Title */}
        <h2 className="text-xl font-bold text-black mb-2">
          {event.gigTitle}
        </h2>

        {/* Date and Time */}
        <p className="text-gray-600 text-sm mb-1">
          {formatDate(event.startDate)} {event.startTime} - {event.endTime}
        </p>

        {/* Address */}
        <p className="text-gray-600 text-sm mb-2">
          {event.address}
        </p>

        {/* Distance */}
        <p className="text-gray-600 text-sm mb-3">
          0.0 miles away
        </p>

        {/* View More Details Button */}
        <button
          onClick={() => handleViewMoreDetails(event.id)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          View more details
        </button>
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
              {filteredActiveEvents.map(renderEventCard)}
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
              {filteredMyEvents.map(renderEventCard)}
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
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-text-primary font-bold text-lg mb-2">No candidates yet</h3>
            <p className="text-text-secondary text-sm text-center">Invite talent to see candidates here.</p>
          </div>
        );
      case "Past Events":
        const filteredPastEvents = getFilteredEvents().filter(event => event.status === 'completed' || event.status === 'cancelled');
        if (filteredPastEvents.length > 0) {
          return (
            <div className="p-4">
              {filteredPastEvents.map(renderEventCard)}
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-text-primary font-bold text-lg mb-2">No past events</h3>
              <p className="text-text-secondary text-sm text-center">Your completed events will appear here.</p>
            </div>
          );
        }
      default:
        return null;
    }
  };

  return (
    <div className="bg-background">
      {/* Tab Navigation */}
      <div className="flex border-b border-text-secondary">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-button-red border-b-2 border-button-red"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
}
