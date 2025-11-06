"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { saveUserLocation, parseLocationData } from "../../utils/locationStorageUtils";
import { markPlaceAsSelected } from "../../utils/recentPlacesUtils";

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

type SelectedLocation = {
  city: string;
  state: string;
  lat?: string;
  lng?: string;
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
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [googleResults, setGoogleResults] = useState<GooglePlace[]>([]);
  const [popular, setPopular] = useState<{ city: string; state: string }[]>([]);
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  
  // Check if this is a "change location" flow from settings
  const isChangeLocation = searchParams.get('change') === 'true';

  // Helper function to get approximate coordinates for popular cities
  const getCoordinatesForCity = (city: string, state: string): { lat: number; lng: number } => {
    const coordinates: { [key: string]: { lat: number; lng: number } } = {
      // US Cities
      'New York City': { lat: 40.7128, lng: -74.0060 },
      'Los Angeles': { lat: 34.0522, lng: -118.2437 },
      'Washington': { lat: 38.9072, lng: -77.0369 },
      'Chicago': { lat: 41.8781, lng: -87.6298 },
      'Miami': { lat: 25.7617, lng: -80.1918 },
      // International Cities
      'London': { lat: 51.5074, lng: -0.1278 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Sydney': { lat: -33.8688, lng: 151.2093 },
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      'Berlin': { lat: 52.5200, lng: 13.4050 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'São Paulo': { lat: -23.5505, lng: -46.6333 },
    };
    
    return coordinates[city] || { lat: 0, lng: 0 }; // Default to coordinates origin
  };

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('No authenticated user');
          setCurrentUserId(null);
        } else {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setCurrentUserId(null);
      }
    };

    getCurrentUser();
  }, []);

  // Load default "popular" list (Global)
  useEffect(() => {
    setPopular([
      { city: "New York City", state: "New York" },
      { city: "Los Angeles", state: "California" },
      { city: "London", state: "England" },
      { city: "Tokyo", state: "Japan" },
      { city: "Paris", state: "France" },
      { city: "Sydney", state: "Australia" },
      { city: "Toronto", state: "Canada" },
      { city: "Berlin", state: "Germany" },
      { city: "Mumbai", state: "India" },
      { city: "São Paulo", state: "Brazil" },
      { city: "Madrid", state: "Spain" },
      { city: "Rome", state: "Italy" },
      { city: "Amsterdam", state: "Netherlands" },
      { city: "Vienna", state: "Austria" },
      { city: "Stockholm", state: "Sweden" },
      { city: "Copenhagen", state: "Denmark" },
      { city: "Oslo", state: "Norway" },
      { city: "Helsinki", state: "Finland" },
      { city: "Lisbon", state: "Portugal" },
      { city: "Athens", state: "Greece" },
      { city: "Istanbul", state: "Turkey" },
      { city: "Cairo", state: "Egypt" },
      { city: "Cape Town", state: "South Africa" },
      { city: "Lagos", state: "Nigeria" },
      { city: "Nairobi", state: "Kenya" },
      { city: "Casablanca", state: "Morocco" },
      { city: "Buenos Aires", state: "Argentina" },
      { city: "Santiago", state: "Chile" },
      { city: "Bogotá", state: "Colombia" },
      { city: "Lima", state: "Peru" },
      { city: "Caracas", state: "Venezuela" },
      { city: "Auckland", state: "New Zealand" },
      { city: "Seoul", state: "South Korea" },
      { city: "Bangkok", state: "Thailand" },
      { city: "Singapore", state: "Singapore" },
      { city: "Kuala Lumpur", state: "Malaysia" },
      { city: "Jakarta", state: "Indonesia" },
      { city: "Manila", state: "Philippines" },
      { city: "Ho Chi Minh City", state: "Vietnam" },
      { city: "Moscow", state: "Russia" },
      { city: "Kiev", state: "Ukraine" },
      { city: "Warsaw", state: "Poland" },
      { city: "Brussels", state: "Belgium" },
      { city: "Zurich", state: "Switzerland" },
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
        
        // Try multiple search types for comprehensive results
        const searchTypes = [
          '(cities)',           // Cities
          '(regions)',          // States, provinces, countries
          'geocode',            // Any geographic location
          'establishment'       // Specific places
        ];
        
        // Add country-specific searches for better results
        const countryKeywords = ['japan', 'germany', 'france', 'spain', 'italy', 'brazil', 'australia', 'canada', 'mexico', 'india', 'china', 'korea', 'thailand', 'singapore', 'malaysia', 'indonesia', 'philippines', 'vietnam', 'russia', 'ukraine', 'poland', 'netherlands', 'belgium', 'switzerland', 'austria', 'sweden', 'norway', 'denmark', 'finland', 'portugal', 'greece', 'turkey', 'egypt', 'south africa', 'nigeria', 'kenya', 'morocco', 'argentina', 'chile', 'colombia', 'peru', 'venezuela', 'new zealand'];
        
        // Check if search term matches a country
        const isCountrySearch = countryKeywords.some(country => 
          search.toLowerCase().includes(country.toLowerCase()) || 
          country.toLowerCase().includes(search.toLowerCase())
        );
        
        let allPredictions: google.maps.places.AutocompletePrediction[] = [];
        let completedSearches = 0;
        
        // Search with each type
        searchTypes.forEach((type, index) => {
          autocompleteService.current!.getPlacePredictions(
            {
              input: search,
              types: [type]
            },
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                // Add predictions that aren't already in the list
                predictions.forEach(prediction => {
                  if (!allPredictions.some(existing => existing.place_id === prediction.place_id)) {
                    allPredictions.push(prediction);
                  }
                });
              }
              
              completedSearches++;
              
              // When all searches are complete, process results
              if (completedSearches === searchTypes.length) {
                // Sort predictions by relevance and limit to 20
                const sortedPredictions = allPredictions
                  .sort((a, b) => {
                    // Prioritize exact matches
                    const aExact = a.description.toLowerCase().includes(search.toLowerCase());
                    const bExact = b.description.toLowerCase().includes(search.toLowerCase());
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    
                    // For country searches, prioritize cities in that country
                    if (isCountrySearch) {
                      const aInCountry = a.description.toLowerCase().includes(search.toLowerCase());
                      const bInCountry = b.description.toLowerCase().includes(search.toLowerCase());
                      if (aInCountry && !bInCountry) return -1;
                      if (!aInCountry && bInCountry) return 1;
                    }
                    
                    return 0;
                  })
                  .slice(0, 20);
                
                setGoogleResults(sortedPredictions);
                setIsLoading(false);
                
                // If no Google results, try Nominatim fallback
                if (sortedPredictions.length === 0) {
                  searchWithNominatim();
                }
              }
            }
          );
        });
        
        // For country searches, also try a broader search without type restrictions
        if (isCountrySearch) {
          autocompleteService.current!.getPlacePredictions(
            {
              input: search,
              // No type restriction for broader results
            },
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                // Add predictions that aren't already in the list
                predictions.forEach(prediction => {
                  if (!allPredictions.some(existing => existing.place_id === prediction.place_id)) {
                    allPredictions.push(prediction);
                  }
                });
                
                // Re-sort and update results
                const sortedPredictions = allPredictions
                  .sort((a, b) => {
                    const aExact = a.description.toLowerCase().includes(search.toLowerCase());
                    const bExact = b.description.toLowerCase().includes(search.toLowerCase());
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    return 0;
                  })
                  .slice(0, 20);
                
                setGoogleResults(sortedPredictions);
              }
            }
          );
        }
      } else {
        // Fallback to Nominatim if Google Places not available
        searchWithNominatim();
      }
    };

    const searchWithNominatim = async () => {
      try {
        setIsLoading(true);
        
        // Try with CORS proxy first, then direct call as fallback
        const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&addressdetails=1&limit=10&accept-language=en`;
        
        let response;
        try {
          // First try with CORS proxy
          response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`);
          if (response.ok) {
            const proxyData = await response.json();
            const data = JSON.parse(proxyData.contents);
            
            if (data && data.length > 0) {
              const nominatimResults = data.map((item: any) => ({
                display_name: item.display_name,
                lat: item.lat,
                lon: item.lon,
                address: item.address
              }));
              setResults(nominatimResults);
              setGoogleResults([]);
              return;
            }
          }
        } catch (proxyError) {
          console.log('CORS proxy failed, trying direct call:', proxyError);
        }
        
        // Fallback: try direct call (may fail due to CORS)
        try {
          response = await fetch(searchUrl, { 
            headers: { 
              "User-Agent": "GA4U-App",
              "Accept": "application/json"
            },
            mode: 'cors'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const nominatimResults = data.map((item: any) => ({
                display_name: item.display_name,
                lat: item.lat,
                lon: item.lon,
                address: item.address
              }));
              setResults(nominatimResults);
              setGoogleResults([]);
              return;
            }
          }
        } catch (directError) {
          console.log('Direct Nominatim call failed:', directError);
        }
        
        // If both fail, show no results
        setResults([]);
        console.log('Both Nominatim calls failed, showing no results');
        
      } catch (error) {
        console.error('Nominatim search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Start the search
    searchWithGooglePlaces();
  }, [search, isGoogleMapsLoaded]);

  // Handle Google Places selection
  const handleGooglePlaceSelect = async (place: GooglePlace) => {
    if (placesService.current) {
      setIsLoading(true);
      placesService.current.getDetails(
        {
          placeId: place.place_id,
          fields: ['name', 'geometry', 'address_components', 'formatted_address']
        },
        async (details, status) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
            let city = '';
            let state = '';
            
            // Extract city and state/country from address components
            if (details.address_components) {
              for (const component of details.address_components) {
                if (component.types.includes('locality')) {
                  city = component.long_name;
                } else if (component.types.includes('administrative_area_level_1')) {
                  state = component.long_name; // Use long_name for international locations
                } else if (component.types.includes('administrative_area_level_2') && !city) {
                  // For some locations, the city might be at level 2
                  city = component.long_name;
                } else if (component.types.includes('country') && !state) {
                  // Fallback to country if no state/province found
                  state = component.long_name;
                }
              }
            }
            
            // Fallback to place name if city not found
            if (!city) {
              // Try to extract city from the formatted address or place name
              const placeName = details.name || details.formatted_address || '';
              const addressParts = placeName.split(',');
              
              // Use the first part as city if it looks like a city name
              if (addressParts.length > 0) {
                const firstPart = addressParts[0].trim();
                // Only use if it doesn't contain obvious non-city words
                if (firstPart && !firstPart.toLowerCase().includes('street') && 
                    !firstPart.toLowerCase().includes('avenue') && 
                    !firstPart.toLowerCase().includes('road')) {
                  city = firstPart;
                }
              }
              
              // If still no city, use a more descriptive fallback
              if (!city) {
                // Special handling for Mexico City
                if (placeName.toLowerCase().includes('mexico city') || 
                    placeName.toLowerCase().includes('ciudad de méxico')) {
                  city = 'Mexico City';
                } else {
                  city = 'Selected Location';
                }
              }
            }
            
            // CRITICAL FIX: Apply the same duplicate prevention logic as in display
            // If city and state are the same, try to extract proper state from description
            if (city === state) {
              const descriptionParts = place.description.split(',');
              if (descriptionParts.length >= 2) {
                state = descriptionParts[descriptionParts.length - 1].trim();
              }
            }
            
            // Special handling for Mexico City duplicates
            if (city.toLowerCase().includes('mexico city') && 
                state.toLowerCase().includes('mexico city')) {
              state = 'Mexico';
            }
            
            console.log('🎯 Google Place Selection:', {
              original_city: city,
              original_state: state,
              final_city: city,
              final_state: state,
              description: place.description
            });
            
            const lat = typeof details.geometry?.location?.lat === 'function' 
              ? details.geometry.location.lat() 
              : details.geometry?.location?.lat;
            const lng = typeof details.geometry?.location?.lng === 'function' 
              ? details.geometry.location.lng() 
              : details.geometry?.location?.lng;
            
            if (lat && lng) {
              // Mark place as selected for recently searched
              const placeData = {
                place_id: place.place_id,
                name: details.name || place.structured_formatting.main_text,
                address: details.formatted_address,
                vicinity: place.structured_formatting.secondary_text,
                formatted_address: details.formatted_address,
                geometry: {
                  location: {
                    lat: () => lat,
                    lng: () => lng
                  }
                }
              };
              await markPlaceAsSelected(placeData);
              
              // Set selected location with coordinates
              setSelected({
                city,
                state,
                lat: lat.toString(),
                lng: lng.toString()
              });
              // Clear search results
              setGoogleResults([]);
              setResults([]);
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
    let city = '';
    let state = '';
    
    // Enhanced parsing for different location types
    if (location.address) {
      // Try different city fields
      city = location.address.city || 
             location.address.town || 
             location.address.village || 
             location.address.municipality ||
             location.address.county ||
             location.address.hamlet ||
             '';
      
      // Try different state/province/country fields
      state = location.address.state || 
              location.address.province || 
              location.address.region ||
              location.address.country ||
              '';
    }
    
    // Fallback: parse from display_name if address components are missing
    if (!city || !state) {
      const displayParts = location.display_name.split(',');
      if (displayParts.length >= 2) {
        if (!city) {
          const firstPart = displayParts[0]?.trim();
          // Only use if it looks like a city name
          if (firstPart && !firstPart.toLowerCase().includes('street') && 
              !firstPart.toLowerCase().includes('avenue') && 
              !firstPart.toLowerCase().includes('road')) {
            city = firstPart;
          }
        }
        if (!state) {
          const secondPart = displayParts[1]?.trim();
          if (secondPart) {
            state = secondPart;
          }
        }
      }
    }
    
    // Final fallbacks with better names
    if (!city) {
      // Special handling for Mexico City
      if (location.display_name.toLowerCase().includes('mexico city') || 
          location.display_name.toLowerCase().includes('ciudad de méxico')) {
        city = 'Mexico City';
      } else {
        city = 'Selected Location';
      }
    }
    if (!state) state = 'Selected Area';
    
    // CRITICAL FIX: Apply duplicate prevention logic
    if (city.toLowerCase().includes('mexico city') && 
        state.toLowerCase().includes('mexico city')) {
      state = 'Mexico';
    }
    
    console.log('📍 Nominatim location parsed:', { 
      original_city: city, 
      original_state: state, 
      final_city: city, 
      final_state: state, 
      lat: location.lat, 
      lng: location.lon 
    });
    
    // Set selected location
    setSelected({
      city,
      state,
      lat: location.lat,
      lng: location.lon
    });
    
    // Clear search results
    setGoogleResults([]);
    setResults([]);
  };

  const handleDone = async () => {
    if (!selected || !currentUserId) {
      console.error('No location selected or user not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      // Create location data from selected location
      const locationData = parseLocationData(
        `${selected.city}, ${selected.state}`,
        `${selected.city}, ${selected.state}`,
        undefined, // We'll need to get coordinates from Google Places
        undefined
      );

      // Try to determine country from state name for popular locations
      if (!selected.lat && !selected.lng) {
        const countryMap: { [key: string]: string } = {
          'New York': 'US', 'California': 'US', 'District of Columbia': 'US', 'Illinois': 'US', 'Florida': 'US',
          'England': 'UK', 'Japan': 'JP', 'France': 'FR', 'Australia': 'AU', 'Canada': 'CA', 
          'Germany': 'DE', 'India': 'IN', 'Brazil': 'BR'
        };
        locationData.country = countryMap[selected.state] || 'Unknown';
      }

      // If we have coordinates from a Google Places selection, use them
      // Otherwise, we'll need to geocode the city/state
      if (selected.lat && selected.lng) {
        locationData.latitude = parseFloat(selected.lat);
        locationData.longitude = parseFloat(selected.lng);
      } else {
        // For popular locations, we'll use approximate coordinates
        const coordinates = getCoordinatesForCity(selected.city, selected.state);
        locationData.latitude = coordinates.lat;
        locationData.longitude = coordinates.lng;
      }

      // Save to Supabase
      const savedLocation = await saveUserLocation(currentUserId, locationData);
      
      if (savedLocation) {
        console.log('✅ Location saved successfully:', savedLocation);
        
        // Navigate based on the flow first
        if (isChangeLocation) {
          // If coming from settings, go back to gigagent4u with location changed flag
          router.push('/gigagent4u?locationChanged=true');
        } else {
          // Default flow, go to map page with location changed flag
          router.push('/map?locationChanged=true');
        }
        
        // Dispatch location changed event after navigation with a small delay
        // This ensures the target page is loaded and ready to receive the event
        setTimeout(() => {
          console.log('🔄 Dispatching locationChanged event...');
          window.dispatchEvent(new CustomEvent('locationChanged', {
            detail: { location: savedLocation }
          }));
        }, 500); // 500ms delay to ensure page navigation is complete
        
      } else {
        console.error('❌ Failed to save location');
        // Fallback to old behavior
        router.push(`/locationreview?city=${selected.city}&state=${selected.state}`);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      // Fallback to old behavior
      router.push(`/locationreview?city=${selected.city}&state=${selected.state}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Use GPS location (Global support with fallbacks)
  const handleUseMyLocation = async () => {
    console.log('🌍 Starting location detection...');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      alert('Location services are not supported by your browser. Please select a location manually.');
      return;
    }

    // Show loading state
    setIsLoading(true);

    try {
      // Get current position with timeout and high accuracy
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log('📍 GPS coordinates obtained:', { latitude, longitude });
          
          try {
            // Try multiple reverse geocoding services for better accuracy
            let locationData = null;
            
            // First try: Nominatim (OpenStreetMap) - works globally
            try {
              const nominatimRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`,
                { headers: { "User-Agent": "GA4U-App" } }
              );
              const nominatimData = await nominatimRes.json();
              
              if (nominatimData && nominatimData.address) {
                const city = nominatimData.address.city || 
                           nominatimData.address.town || 
                           nominatimData.address.village || 
                           nominatimData.address.municipality ||
                           nominatimData.address.county ||
                           "Unknown City";
                
                const state = nominatimData.address.state || 
                             nominatimData.address.province ||
                             nominatimData.address.region ||
                             nominatimData.address.country ||
                             "Unknown State";
                
                const country = nominatimData.address.country || "Unknown";
                
                locationData = {
                  city,
                  state,
                  country,
                  lat: latitude.toString(),
                  lng: longitude.toString()
                };
                
                console.log('✅ Nominatim location found:', locationData);
              }
            } catch (nominatimError) {
              console.warn('Nominatim reverse geocoding failed:', nominatimError);
            }
            
            // Fallback: If Nominatim failed, try to determine location from coordinates
            if (!locationData) {
              console.log('🔄 Using coordinate-based fallback...');
              
              // Determine approximate location from coordinates
              let city = "Unknown City";
              let state = "Unknown State";
              let country = "Unknown";
              
              // Rough coordinate-based location detection
              if (latitude >= 40.7 && latitude <= 40.8 && longitude >= -74.0 && longitude <= -73.9) {
                city = "New York City";
                state = "New York";
                country = "US";
              } else if (latitude >= 34.0 && latitude <= 34.1 && longitude >= -118.3 && longitude <= -118.2) {
                city = "Los Angeles";
                state = "California";
                country = "US";
              } else if (latitude >= 51.5 && latitude <= 51.6 && longitude >= -0.2 && longitude <= -0.1) {
                city = "London";
                state = "England";
                country = "UK";
              } else if (latitude >= 35.6 && latitude <= 35.7 && longitude >= 139.7 && longitude <= 139.8) {
                city = "Tokyo";
                state = "Japan";
                country = "JP";
              } else {
                // Generic fallback based on coordinates
                city = `Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
                state = "Detected";
                country = "Unknown";
              }
              
              locationData = {
                city,
                state,
                country,
                lat: latitude.toString(),
                lng: longitude.toString()
              };
              
              console.log('📍 Coordinate-based location determined:', locationData);
            }
            
            if (locationData) {
              setSelected({
                city: locationData.city,
                state: locationData.state,
                lat: locationData.lat,
                lng: locationData.lng
              });
              
              console.log('✅ Location set successfully:', locationData);
            } else {
              throw new Error('Could not determine location from coordinates');
            }
            
          } catch (reverseGeocodeError) {
            console.error('Reverse geocoding failed:', reverseGeocodeError);
            
            // Final fallback: Use coordinates directly
            setSelected({
              city: `Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
              state: "GPS Detected",
              lat: latitude.toString(),
              lng: longitude.toString()
            });
            
            console.log('📍 Using GPS coordinates as fallback');
          }
          
          setIsLoading(false);
        },
        (err) => {
          console.error('Geolocation failed:', err);
          setIsLoading(false);
          
          // Provide user-friendly error messages
          let errorMessage = 'Could not detect your location. ';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage += 'Please allow location access in your browser settings.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case err.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Please select a location manually.';
              break;
          }
          
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } catch (error) {
      console.error('Error using GPS:', error);
      setIsLoading(false);
      alert('Location services failed. Please select a location manually.');
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
          disabled={!selected || isSaving}
          className="text-button-red font-semibold disabled:opacity-50 hover:text-button-red-hover transition-colors"
        >
          {isSaving ? 'Saving...' : 'Done'}
        </button>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          value={selected ? `${selected.city}, ${selected.state}` : search}
          onChange={(e) => {
            if (!selected) {
              setSearch(e.target.value);
            }
          }}
          onClick={() => {
            if (selected) {
              setSelected(null);
              setSearch('');
            }
          }}
          placeholder="Search any city, state, or country..."
          className="w-full px-4 py-3 radius-md bg-input-background text-text-primary placeholder-text-secondary outline-none border border-text-secondary focus:border-button-red transition-colors"
        />
        {selected && (
          <button
            onClick={() => {
              setSelected(null);
              setSearch('');
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        )}
      </div>

      {/* Use my location */}
      <button
        onClick={handleUseMyLocation}
        disabled={isLoading}
        className={`w-full py-3 radius-md font-semibold mb-4 transition-colors ${
          isLoading 
            ? "bg-gray-500 text-gray-300 cursor-not-allowed" 
            : "bg-button-red text-white hover:bg-button-red-hover"
        }`}
      >
        {isLoading ? "Detecting location..." : "Use my location"}
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
                onClick={() => {
                  setSelected({ city: loc.city, state: loc.state });
                  setGoogleResults([]);
                  setResults([]);
                }}
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
      {search.length >= 2 && googleResults.length > 0 && !selected && (
        <div className="space-y-2">
          {googleResults.map((place, index) => {
            const isSelected = selected && 
              selected.city === place.structured_formatting.main_text &&
              selected.state === place.structured_formatting.secondary_text;
            
            // Fix the display text to avoid duplicates
            let displayCity = place.structured_formatting.main_text;
            let displayState = place.structured_formatting.secondary_text;
            
            // If city and state are the same, try to extract proper state from description
            if (displayCity === displayState) {
              const descriptionParts = place.description.split(',');
              if (descriptionParts.length >= 2) {
                displayState = descriptionParts[descriptionParts.length - 1].trim();
              }
            }
            
            // Special handling for Mexico City
            if (displayCity.toLowerCase().includes('mexico city') && 
                displayState.toLowerCase().includes('mexico city')) {
              displayState = 'Mexico';
            }
            
            console.log('🔍 Google Place Display:', {
              main_text: place.structured_formatting.main_text,
              secondary_text: place.structured_formatting.secondary_text,
              description: place.description,
              displayCity,
              displayState
            });
            
            return (
              <div
                key={`google-${index}-${place.place_id}`}
                className={`cursor-pointer p-4 radius-md transition-colors ${
                  isSelected
                    ? "bg-input-background border border-button-red" 
                    : "hover:bg-surface"
                }`}
                onClick={() => handleGooglePlaceSelect(place)}
              >
                <div className="text-body text-text-primary font-medium">
                  {displayCity}
                </div>
                <div className="text-sm text-text-secondary">
                  {displayState}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nominatim Results (Fallback) */}
      {search.length >= 2 && googleResults.length === 0 && results.length > 0 && !selected && (
        <div className="space-y-2">
          {results.map((loc, index) => {
            // Use the same improved parsing logic as in handleNominatimSelect
            let city = '';
            let state = '';
            
            if (loc.address) {
              city = loc.address.city || 
                     loc.address.town || 
                     loc.address.village || 
                     loc.address.municipality ||
                     loc.address.county ||
                     loc.address.hamlet ||
                     '';
              
              state = loc.address.state || 
                      loc.address.province || 
                      loc.address.region ||
                      loc.address.country ||
                      '';
            }
            
            // Fallback: parse from display_name if address components are missing
            if (!city || !state) {
              const displayParts = loc.display_name.split(',');
              if (displayParts.length >= 2) {
                if (!city) {
                  const firstPart = displayParts[0]?.trim();
                  if (firstPart && !firstPart.toLowerCase().includes('street') && 
                      !firstPart.toLowerCase().includes('avenue') && 
                      !firstPart.toLowerCase().includes('road')) {
                    city = firstPart;
                  }
                }
                if (!state) {
                  const secondPart = displayParts[1]?.trim();
                  if (secondPart) {
                    state = secondPart;
                  }
                }
              }
            }
            
            // Final fallbacks with better names
            if (!city) {
              if (loc.display_name.toLowerCase().includes('mexico city') || 
                  loc.display_name.toLowerCase().includes('ciudad de méxico')) {
                city = 'Mexico City';
              } else {
                city = 'Selected Location';
              }
            }
            if (!state) state = 'Selected Area';
            
            // Special handling for Mexico City duplicates
            if (city.toLowerCase().includes('mexico city') && 
                state.toLowerCase().includes('mexico city')) {
              state = 'Mexico';
            }

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
