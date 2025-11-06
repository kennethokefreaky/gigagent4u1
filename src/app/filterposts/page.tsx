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
  const [loading, setLoading] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const talentCategories: TalentCategory[] = ["Boxer", "MMA", "Comedian", "Musician", "Wrestler", "Other"];
  const timeOptions: TimePosted[] = ["Just now", "Last 24 hours", "1+ days", "1 week", "1 month", "1+ months"];

  // Debounced save function to prevent multiple rapid saves
  const debouncedSaveFilterPreferences = (filterState: FilterState) => {
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set a new timeout to save after 500ms of no changes
    const newTimeout = setTimeout(() => {
      saveFilterPreferences(filterState);
    }, 500);

    setSaveTimeout(newTimeout);
  };

  // Save filter preferences to database - BULLETPROOF APPROACH
  const saveFilterPreferences = async (filterState: FilterState) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user - saving to sessionStorage instead');
        sessionStorage.setItem('eventFilters', JSON.stringify(filterState));
        return;
      }

      // BULLETPROOF APPROACH: Delete existing record first, then insert new one
      // This eliminates all constraint conflicts
      const { error: deleteError } = await supabase
        .from('filter_preferences')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.log('No existing record to delete (this is normal for first time)');
      }

      // Now insert the new record (no conflicts possible)
      const { error: insertError } = await supabase
        .from('filter_preferences')
        .insert({
          user_id: user.id,
          categories: filterState.categories,
          time_posted: filterState.timePosted,
          distance: filterState.distance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting filter preferences:', insertError);
        // Fallback to sessionStorage
        sessionStorage.setItem('eventFilters', JSON.stringify(filterState));
      } else {
        console.log('Filter preferences saved successfully');
      }
    } catch (error) {
      console.error('Error saving filter preferences:', error);
      // Fallback to sessionStorage
      sessionStorage.setItem('eventFilters', JSON.stringify(filterState));
    }
  };

  // Load filter preferences from database
  const loadFilterPreferences = async (): Promise<FilterState> => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user - loading from sessionStorage instead');
        const savedFilters = sessionStorage.getItem('eventFilters');
        if (savedFilters) {
          return JSON.parse(savedFilters);
        }
        return { categories: [], timePosted: null, distance: 50 };
      }

      const { data, error } = await supabase
        .from('filter_preferences')
        .select('categories, time_posted, distance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading filter preferences:', error);
        // Fallback to sessionStorage
        const savedFilters = sessionStorage.getItem('eventFilters');
        if (savedFilters) {
          return JSON.parse(savedFilters);
        }
        return { categories: [], timePosted: null, distance: 50 };
      }

      if (data) {
        return {
          categories: data.categories || [],
          timePosted: data.time_posted || null,
          distance: data.distance || 50
        };
      }

      // No saved preferences, check sessionStorage
      const savedFilters = sessionStorage.getItem('eventFilters');
      if (savedFilters) {
        return JSON.parse(savedFilters);
      }

      return { categories: [], timePosted: null, distance: 50 };
    } catch (error) {
      console.error('Error loading filter preferences:', error);
      // Fallback to sessionStorage
      const savedFilters = sessionStorage.getItem('eventFilters');
      if (savedFilters) {
        return JSON.parse(savedFilters);
      }
      return { categories: [], timePosted: null, distance: 50 };
    }
  };

  // Load all events and filter preferences on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load events
        const { getAllPostsFromSupabase } = await import('../../utils/eventUtils');
        const supabaseEvents = await getAllPostsFromSupabase();
        const sessionEvents = getAllEvents();
        const allEvents = [...supabaseEvents, ...sessionEvents];
        setAllEvents(allEvents);

        // Load saved filter preferences
        const savedFilters = await loadFilterPreferences();
        setFilters(savedFilters);
      } catch (error) {
        console.error('Error loading data:', error);
        const events = getAllEvents();
        setAllEvents(events);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

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
    const newFilters = {
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter(c => c !== category)
        : [...filters.categories, category]
    };
    setFilters(newFilters);
    saveFilterPreferences(newFilters);
  };

  const handleTimePostedSelect = (time: TimePosted) => {
    const newFilters = {
      ...filters,
      timePosted: filters.timePosted === time ? null : time
    };
    setFilters(newFilters);
    saveFilterPreferences(newFilters);
  };

  const handleDistanceChange = (distance: number) => {
    const newFilters = {
      ...filters,
      distance
    };
    setFilters(newFilters);
    // Use debounced save for distance changes to prevent rapid saves
    debouncedSaveFilterPreferences(newFilters);
  };

  const handleClearAll = () => {
    const defaultFilters = {
      categories: [],
      timePosted: null,
      distance: 50
    };
    setFilters(defaultFilters);
    saveFilterPreferences(defaultFilters);
    // Clear filters from sessionStorage as backup
    sessionStorage.removeItem('eventFilters');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('filtersApplied'));
  };

  const handleDone = () => {
    // Save filters to database and sessionStorage
    saveFilterPreferences(filters);
    sessionStorage.setItem('eventFilters', JSON.stringify(filters));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('filtersApplied'));
    router.back();
  };

  const handleShowResults = () => {
    // Save filters to database and sessionStorage, then navigate back
    saveFilterPreferences(filters);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading filters...</p>
        </div>
      </div>
    );
  }

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
