"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllEvents } from "../../utils/eventUtils";

type TalentCategory = "Boxer" | "MMA" | "Comedian" | "Musician" | "Wrestler" | "Other";
type TimePosted = "Just now" | "Last 24 hours" | "1+ days" | "1 week" | "1 month" | "1+ months";

interface FilterState {
  categories: TalentCategory[];
  timePosted: TimePosted | null;
  distance: number;
}

export default function FilterPostsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    timePosted: null,
    distance: 50
  });
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [filteredCount, setFilteredCount] = useState(0);

  const talentCategories: TalentCategory[] = ["Boxer", "MMA", "Comedian", "Musician", "Wrestler", "Other"];
  const timeOptions: TimePosted[] = ["Just now", "Last 24 hours", "1+ days", "1 week", "1 month", "1+ months"];

  // Load all events on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { getAllPostsFromSupabase } = await import('../../utils/eventUtils');
        const supabaseEvents = await getAllPostsFromSupabase();
        const sessionEvents = getAllEvents();
        const allEvents = [...supabaseEvents, ...sessionEvents];
        setAllEvents(allEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        const events = getAllEvents();
        setAllEvents(events);
      }
    };
    
    loadEvents();
  }, []);

  // Update filtered count whenever filters or events change
  useEffect(() => {
    let filtered = allEvents.filter(event => event.status === 'active');

    // Filter by categories
    if (filters.categories.length > 0) {
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

    setFilteredCount(filtered.length);
  }, [filters, allEvents]);

  const handleCategoryToggle = (category: TalentCategory) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleTimePostedSelect = (time: TimePosted) => {
    setFilters(prev => ({
      ...prev,
      timePosted: prev.timePosted === time ? null : time
    }));
  };

  const handleDistanceChange = (distance: number) => {
    setFilters(prev => ({
      ...prev,
      distance
    }));
  };

  const handleClearAll = () => {
    setFilters({
      categories: [],
      timePosted: null,
      distance: 50
    });
    // Clear filters from sessionStorage
    sessionStorage.removeItem('eventFilters');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('filtersApplied'));
  };

  const handleDone = () => {
    // Save filters to sessionStorage for use in main page
    sessionStorage.setItem('eventFilters', JSON.stringify(filters));
    router.back();
  };

  const handleShowResults = () => {
    // Save filters and navigate back to show filtered results
    sessionStorage.setItem('eventFilters', JSON.stringify(filters));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('filtersApplied'));
    router.back();
  };

  const getFilteredEventsCount = () => {
    let filtered = allEvents.filter(event => event.status === 'active');

    // Filter by categories
    if (filters.categories.length > 0) {
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

    return filtered.length;
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <h1 className="text-lg font-semibold text-text-primary">Filter</h1>
        <button
          onClick={handleDone}
          className="text-button-red font-semibold hover:text-button-red-hover transition-colors"
        >
          Done
        </button>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Section 1: Category */}
        <div>
          <h2 className="text-subheading font-semibold text-text-primary mb-4">Category</h2>
          <div className="flex flex-wrap gap-2">
            {talentCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.categories.includes(category)
                    ? "bg-button-red text-white"
                    : "bg-input-background text-text-primary border border-text-secondary hover:bg-surface"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Time Posted */}
        <div>
          <h2 className="text-subheading font-semibold text-text-primary mb-4">Time Posted</h2>
          <div className="flex flex-wrap gap-2">
            {timeOptions.map((time) => (
              <button
                key={time}
                onClick={() => handleTimePostedSelect(time)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.timePosted === time
                    ? "bg-button-red text-white"
                    : "bg-input-background text-text-primary border border-text-secondary hover:bg-surface"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Distance */}
        <div>
          <h2 className="text-subheading font-semibold text-text-primary mb-4">Distance</h2>
          <div className="space-y-4">
            <div className="px-4">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.distance}
                onChange={(e) => handleDistanceChange(Number(e.target.value))}
                className="w-full h-2 bg-input-background rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #FF2C2C 0%, #FF2C2C ${filters.distance}%, #2C2C2C ${filters.distance}%, #2C2C2C 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>0 miles</span>
              <span className="text-button-red font-semibold">{filters.distance} miles</span>
              <span>100 miles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-text-secondary p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClearAll}
            className="px-6 py-3 border border-text-secondary text-text-primary rounded-lg font-semibold hover:bg-input-background transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleShowResults}
            className="bg-button-red hover:bg-button-red-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Show {filteredCount} Results
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #FF2C2C;
          cursor: pointer;
          border: 2px solid #1A1A1A;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #FF2C2C;
          cursor: pointer;
          border: 2px solid #1A1A1A;
        }
      `}</style>
    </div>
  );
}
