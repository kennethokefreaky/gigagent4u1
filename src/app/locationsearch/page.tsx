"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

// Declare global google type
declare global {
  interface Window {
    google: typeof google;
  }
}

type Location = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    state?: string;
    town?: string;
    village?: string;
  };
};

type GooglePlace = {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

export default function LocationSearch() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [googleResults, setGoogleResults] = useState<GooglePlace[]>([]);
  const [popular, setPopular] = useState<{ city: string; state: string }[]>([]);
  const [selected, setSelected] = useState<{ city: string; state: string } | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Load default "popular" list (US only)
  useEffect(() => {
    setPopular([
      { city: "New York City", state: "New York" },
      { city: "Los Angeles", state: "California" },
      { city: "Washington", state: "District of Columbia" },
      { city: "Chicago", state: "Illinois" },
      { city: "Miami", state: "Florida" },
    ]);
  }, []);

  // Initialize Google Places services when script loads
  useEffect(() => {
    if (isGoogleMapsLoaded && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      
      // Create a dummy div for PlacesService
      const dummyDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
    }
  }, [isGoogleMapsLoaded]);

  // Search with Google Places Autocomplete (primary) and Nominatim (fallback)
  useEffect(() => {
    if (search.length < 2) {
      setGoogleResults([]);
      setResults([]);
      return;
    }

    const searchWithGooglePlaces = async () => {
      if (autocompleteService.current) {
        setIsLoading(true);
        autocompleteService.current.getPlacePredictions(
          {
            input: search,
            types: ['(cities)'],
            componentRestrictions: { country: 'us' }
          },
          (predictions, status) => {
            setIsLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setGoogleResults(predictions);
              setResults([]); // Clear Nominatim results when Google results are available
            } else {
              // Fallback to Nominatim if Google Places fails
              searchWithNominatim();
            }
          }
        );
      } else {
        // Fallback to Nominatim if Google Places not available
        searchWithNominatim();
      }
    };

    const searchWithNominatim = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            search
          )}&format=json&addressdetails=1&limit=5&countrycodes=us`,
          { headers: { "User-Agent": "GA4U-App" } }
        );
        const data: Location[] = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Error fetching search:", err);
      }
    };

    const debounce = setTimeout(searchWithGooglePlaces, 500);
    return () => clearTimeout(debounce);
  }, [search, isGoogleMapsLoaded]);

  // Handle Google Places selection
  const handleGooglePlaceSelect = async (place: GooglePlace) => {
    if (placesService.current) {
      setIsLoading(true);
      placesService.current.getDetails(
        {
          placeId: place.place_id,
          fields: ['name', 'geometry', 'address_components']
        },
        (details, status) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
            let city = '';
            let state = '';
            
            // Extract city and state from address components
            if (details.address_components) {
              for (const component of details.address_components) {
                if (component.types.includes('locality')) {
                  city = component.long_name;
                } else if (component.types.includes('administrative_area_level_1')) {
                  state = component.short_name;
                }
              }
            }
            
            // Fallback to place name if city not found
            if (!city) {
              city = details.name || 'Unknown City';
            }
            
            const lat = details.geometry?.location?.lat();
            const lng = details.geometry?.location?.lng();
            
            if (lat && lng) {
              router.push(`/locationreview?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&lat=${lat}&lng=${lng}`);
            } else {
              // Fallback to Nominatim if no coordinates
              handleNominatimSelect({ display_name: place.description, lat: '', lon: '' });
            }
          }
        }
      );
    }
  };

  // Handle Nominatim selection (fallback)
  const handleNominatimSelect = (location: Location) => {
    const city = location.address?.city || location.address?.town || location.address?.village || 'Unknown City';
    const state = location.address?.state || 'Unknown State';
    
    if (location.lat && location.lng) {
      router.push(`/locationreview?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&lat=${location.lat}&lng=${location.lng}`);
    } else {
      router.push(`/locationreview?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`);
    }
  };

  const handleDone = () => {
    if (selected) {
      router.push(`/locationreview?city=${selected.city}&state=${selected.state}`);
    }
  };

  // Use GPS location (US only)
  const handleUseMyLocation = async () => {
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&countrycodes=us`,
            { headers: { "User-Agent": "GA4U-App" } }
          );
          const data = await res.json();
          
          // Check if location is in US
          if (data.address.country_code !== 'us') {
            console.warn("Location outside US");
            return;
          }
          
          const city = data.address.city || data.address.town || data.address.village || "Unknown City";
          const state = data.address.state || "Unknown State";

          setSelected({ city, state });
        },
        (err) => {
          console.warn("Geolocation failed:", err);
        }
      );
    } catch (error) {
      console.error("Error using GPS:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-text-primary flex-col px-6 py-4">
      {/* Google Maps Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsGoogleMapsLoaded(true)}
      />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-subheading font-semibold">Search for a location</h2>
        <button
          onClick={handleDone}
          disabled={!selected}
          className="text-button-red font-semibold disabled:opacity-50 hover:text-button-red-hover transition-colors"
        >
          Done
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Try Los Angeles, California..."
        className="w-full mb-6 px-4 py-3 radius-md bg-input-background text-text-primary placeholder-text-secondary outline-none border border-text-secondary focus:border-button-red transition-colors"
      />

      {/* Use my location */}
      <button
        onClick={handleUseMyLocation}
        className="w-full bg-button-red text-white py-3 radius-md font-semibold mb-4 hover:bg-button-red-hover transition-colors"
      >
        Use my location
      </button>

      {/* Popular Locations */}
      {search.length < 2 && (
        <>
          <p className="text-body text-text-secondary mb-4">Popular locations</p>
          <div className="space-y-2">
            {popular.map((loc, index) => (
              <div
                key={`popular-${index}-${loc.city}-${loc.state}`}
                className={`cursor-pointer p-4 radius-md transition-colors ${
                  selected?.city === loc.city && selected?.state === loc.state
                    ? "bg-input-background border border-button-red" 
                    : "hover:bg-surface"
                }`}
                onClick={() => setSelected(loc)}
              >
                <span className="text-body text-text-primary">
                  {loc.city}, {loc.state}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-button-red"></div>
          <span className="ml-2 text-text-secondary">Searching...</span>
        </div>
      )}

      {/* Google Places Results (Primary) */}
      {search.length >= 2 && googleResults.length > 0 && (
        <div className="space-y-2">
          {googleResults.map((place, index) => (
            <div
              key={`google-${index}-${place.place_id}`}
              className="cursor-pointer p-4 radius-md transition-colors hover:bg-surface"
              onClick={() => handleGooglePlaceSelect(place)}
            >
              <div className="text-body text-text-primary font-medium">
                {place.structured_formatting.main_text}
              </div>
              <div className="text-sm text-text-secondary">
                {place.structured_formatting.secondary_text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nominatim Results (Fallback) */}
      {search.length >= 2 && googleResults.length === 0 && results.length > 0 && (
        <div className="space-y-2">
          {results.map((loc, index) => {
            const city = loc.address?.city || loc.address?.town || loc.address?.village || "Unknown City";
            const state = loc.address?.state || "Unknown State";

            return (
              <div
                key={`search-${index}-${loc.lat}-${loc.lon}-${city}-${state}`}
                className={`cursor-pointer p-4 radius-md transition-colors ${
                  selected?.city === city && selected?.state === state
                    ? "bg-input-background border border-button-red" 
                    : "hover:bg-surface"
                }`}
                onClick={() => handleNominatimSelect(loc)}
              >
                <span className="text-body text-text-primary">
                  {city}, {state}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {search.length >= 2 && googleResults.length === 0 && results.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-text-secondary">No locations found for "{search}"</p>
        </div>
      )}
    </div>
  );
}
