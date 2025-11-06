"use client";

import Navigation from "../components/Navigation";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { checkAndCreateMealTimeNotification } from "../../utils/mealTimeNotifications";
import { getUserPrimaryLocation } from "../../utils/locationStorageUtils";
import { getPlaceRating } from "../../utils/placeFeedbackUtils";
import { getUserDistancePreference, updateUserDistancePreference } from "../../utils/locationStorageUtils";
import { getRecentPlaces, markPlaceAsSelected, markPlaceAsReviewed, recentPlaceToPlaceData, RecentPlace } from "../../utils/recentPlacesUtils";
import { findWrestlingPromotions, WrestlingPromotion } from "../../utils/wrestlingPromotionsData";

// Declare global google type
declare global {
  interface Window {
    google: typeof google;
  }
}


export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showBottomsheet, setShowBottomsheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [showDirectionsPopup, setShowDirectionsPopup] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isCheckingCategories, setIsCheckingCategories] = useState(true);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.Marker | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentMealTime, setCurrentMealTime] = useState<string | null>(null);
  const [showMealTimeNotification, setShowMealTimeNotification] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingDirectionsUrl, setPendingDirectionsUrl] = useState<string | null>(null);
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([]);
  const [placeRatings, setPlaceRatings] = useState<{[key: string]: any}>({});
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [distanceMiles, setDistanceMiles] = useState<number>(10);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Generate unique place ID from Google Places data
  // Helper function to get coordinates from place object (handles both Google Places and wrestling promotions)
  const getPlaceCoordinates = (place: any) => {
    if (!place?.geometry?.location) return { lat: 0, lng: 0 };
    
    const location = place.geometry.location;
    // Check if it's a function (Google Places API) or a number (wrestling promotions)
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
    
    return { lat, lng };
  };

  const generatePlaceId = (place: any): string => {
    if (place.place_id) {
      return place.place_id;
    }
    
    // Fallback: create ID from coordinates and name
    const { lat, lng } = getPlaceCoordinates(place);
    const name = place.name || 'Unknown Place';
    
    return `${name.replace(/\s+/g, '_')}_${lat.toFixed(6)}_${lng.toFixed(6)}`;
  };

  // Load place rating for display
  const loadPlaceRating = async (placeId: string) => {
    try {
      const rating = await getPlaceRating(placeId);
      setPlaceRatings(prev => ({
        ...prev,
        [placeId]: rating
      }));
    } catch (error) {
      console.error('Error loading place rating:', error);
    }
  };

  // Load ratings for multiple places
  const loadPlaceRatings = async (places: any[]) => {
    try {
      const ratingPromises = places.map(place => {
        const placeId = generatePlaceId(place);
        return getPlaceRating(placeId).then(rating => ({ placeId, rating }));
      });
      
      const ratings = await Promise.all(ratingPromises);
      const ratingsMap: {[key: string]: any} = {};
      
      ratings.forEach(({ placeId, rating }) => {
        if (rating) {
          ratingsMap[placeId] = rating;
        }
      });
      
      setPlaceRatings(prev => ({
        ...prev,
        ...ratingsMap
      }));
    } catch (error) {
      console.error('Error loading place ratings:', error);
    }
  };

  // Load recent places
  const loadRecentPlaces = async () => {
    try {
      console.log('🔄 Loading recent places...');
      const recent = await getRecentPlaces(20);
      console.log('📋 Recent places loaded:', recent);
      setRecentPlaces(recent);
      
      // Load ratings for recent places
      const recentPlaceData = recent.map(recentPlaceToPlaceData);
      await loadPlaceRatings(recentPlaceData);
    } catch (error) {
      console.error('❌ Error loading recent places:', error);
    }
  };

  // Navigate to place feedback page
  const navigateToPlaceFeedback = async (place: any) => {
    // Mark place as reviewed when navigating to feedback
    await markPlaceAsReviewed(place);
    
    const placeId = generatePlaceId(place);
    const params = new URLSearchParams({
      placeId: placeId,
      placeName: place.name || 'Unknown Place',
      placeAddress: place.vicinity || place.formatted_address || '',
      // Preserve search context for navigation back
      returnSearchQuery: searchQuery,
      returnShowSearchResults: showSearchResults.toString(),
      returnSearchResultsCount: searchResults.length.toString()
    });
    router.push(`/placefeedback?${params.toString()}`);
  };

  // Detect device type
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };

  const isAndroid = () => {
    if (typeof window === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
  };

  // Open maps in native app or web - IMPROVED VERSION
  const openMapsApp = (lat: number, lng: number, placeName: string) => {
    const encodedPlaceName = encodeURIComponent(placeName);
    
    if (isMobileDevice()) {
      // Mobile: Try native apps with proper user gesture handling
      if (isIOS()) {
        // iOS: Try Google Maps first, then Apple Maps
        const googleMapsUrl = `comgooglemaps://?q=${encodedPlaceName}&center=${lat},${lng}&zoom=14`;
        const appleMapsUrl = `maps://maps.apple.com/?q=${encodedPlaceName}&ll=${lat},${lng}`;
        
        // Try Google Maps first
        const googleMapsLink = document.createElement('a');
        googleMapsLink.href = googleMapsUrl;
        googleMapsLink.style.display = 'none';
        document.body.appendChild(googleMapsLink);
        
        try {
          googleMapsLink.click();
          // If Google Maps doesn't work, try Apple Maps after a short delay
          setTimeout(() => {
            const appleMapsLink = document.createElement('a');
            appleMapsLink.href = appleMapsUrl;
            appleMapsLink.style.display = 'none';
            document.body.appendChild(appleMapsLink);
            appleMapsLink.click();
            document.body.removeChild(appleMapsLink);
          }, 1000);
        } catch (error) {
          console.log('Google Maps not available, trying Apple Maps');
          const appleMapsLink = document.createElement('a');
          appleMapsLink.href = appleMapsUrl;
          appleMapsLink.style.display = 'none';
          document.body.appendChild(appleMapsLink);
          appleMapsLink.click();
          document.body.removeChild(appleMapsLink);
        }
        
        document.body.removeChild(googleMapsLink);
        
      } else if (isAndroid()) {
        // Android: Use intent URL for better compatibility
        const intentUrl = `intent://maps.google.com/maps?q=${lat},${lng}(${encodedPlaceName})#Intent;scheme=https;package=com.google.android.apps.maps;end`;
        const fallbackUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        
        try {
          window.location.href = intentUrl;
        } catch (error) {
          console.log('Intent failed, using fallback');
          window.open(fallbackUrl, '_blank');
        }
      }
    } else {
      // Desktop: Always use web version
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(webUrl, '_blank');
    }
  };


  // Get coordinates from localStorage (same as locationreview)
  const getCoordinates = async () => {
    try {
      // Get current user
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user, using default location');
        return { lat: 40.7128, lng: -74.0060 }; // Default to NYC
      }

      // Get user's primary location from Supabase
      console.log('🔍 Looking for user location in Supabase for user:', user.id);
      const primaryLocation = await getUserPrimaryLocation(user.id);
      
      if (primaryLocation && primaryLocation.latitude && primaryLocation.longitude) {
        console.log('✅ Using YOUR SELECTED location from Supabase:', primaryLocation);
        console.log('📍 Your location:', primaryLocation.display_name);
        console.log('📍 Coordinates:', primaryLocation.latitude, primaryLocation.longitude);
        return { 
          lat: primaryLocation.latitude, 
          lng: primaryLocation.longitude 
        };
      } else {
        console.log('❌ No saved location found in Supabase');
        console.log('💡 You need to set your location first');
        console.log('🔧 Go to Settings > Change Location to select your location');
        console.log('⚠️ Using default NYC coordinates until you set your location');
        return { lat: 40.7128, lng: -74.0060 }; // Default to NYC
      }
    } catch (error) {
      console.error('Error getting coordinates from Supabase:', error);
      return { lat: 40.7128, lng: -74.0060 }; // Default to NYC
    }
  };

  // Get current user ID and load distance preference
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('No authenticated user');
          setCurrentUserId(null);
        } else {
          setCurrentUserId(user.id);
          
          // Load user's distance preference
          const distance = await getUserDistancePreference(user.id);
          setDistanceMiles(distance);
          
          // Load user's recent places
          await loadRecentPlaces();
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setCurrentUserId(null);
      }
    };

    getCurrentUser();
  }, []);

  // Handle locationChanged URL parameter
  useEffect(() => {
    const locationChanged = searchParams.get('locationChanged');
    
    if (locationChanged === 'true' && map && window.google) {
      console.log('🔄 Location changed parameter detected, refreshing map...');
      
      // Remove the parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('locationChanged');
      window.history.replaceState({}, '', url.toString());
      
      // Refresh the map with new location
      const refreshMapLocation = async () => {
        try {
          const coordinates = await getCoordinates();
          
          // Update map center
          map.setCenter(coordinates);
          
          // Update current location marker
          if (currentLocationMarker) {
            currentLocationMarker.setPosition(coordinates);
          } else {
            // Create new current location marker
            const newMarker = new window.google.maps.Marker({
              position: coordinates,
              map: map,
              title: 'Your Location',
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20),
                anchor: new window.google.maps.Point(10, 10)
              }
            });
            setCurrentLocationMarker(newMarker);
          }
          
          console.log('✅ Map location updated from URL parameter to:', coordinates);
        } catch (error) {
          console.error('Error updating map location from URL parameter:', error);
        }
      };
      
      refreshMapLocation();
    }
  }, [searchParams, map, currentLocationMarker]);

  // Handle showBottomsheet URL parameter from placefeedback
  useEffect(() => {
    const showBottomsheet = searchParams.get('showBottomsheet');
    const selectedPlaceId = searchParams.get('selectedPlaceId');
    const selectedPlaceName = searchParams.get('selectedPlaceName');
    const selectedPlaceAddress = searchParams.get('selectedPlaceAddress');
    
    // Handle return from placefeedback with search context
    const returnSearchQuery = searchParams.get('returnSearchQuery');
    const returnShowSearchResults = searchParams.get('returnShowSearchResults');
    const returnSearchResultsCount = searchParams.get('returnSearchResultsCount');
    
    if (showBottomsheet === 'true' && selectedPlaceId && selectedPlaceName) {
      console.log('📍 Showing bottom sheet with selected place from placefeedback');
      
      // Create a place object from the URL parameters
      const placeFromFeedback = {
        place_id: selectedPlaceId,
        name: selectedPlaceName,
        vicinity: selectedPlaceAddress || '',
        formatted_address: selectedPlaceAddress || ''
      };
      
      // Set the selected place and show bottom sheet
      setSelectedPlace(placeFromFeedback);
      setShowBottomsheet(true);
      
      // Restore search context if returning from placefeedback
      if (returnSearchQuery) {
        console.log('🔄 Restoring search context from placefeedback');
        setSearchQuery(returnSearchQuery);
        setShowSearchResults(returnShowSearchResults === 'true');
        // Note: We can't restore the exact search results, but we can restore the search query
        // The user can re-search if they want to see the results again
      }
      
      // Remove the parameters from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('showBottomsheet');
      url.searchParams.delete('selectedPlaceId');
      url.searchParams.delete('selectedPlaceName');
      url.searchParams.delete('selectedPlaceAddress');
      url.searchParams.delete('returnSearchQuery');
      url.searchParams.delete('returnShowSearchResults');
      url.searchParams.delete('returnSearchResultsCount');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Listen for location changes to refresh map
  useEffect(() => {
    const handleLocationChanged = async () => {
      console.log('🔄 Location changed event received, refreshing map...');
      
      // Refresh the map with new location
      if (map && window.google) {
        try {
          const coordinates = await getCoordinates();
          
          // Update map center
          map.setCenter(coordinates);
          
          // Update current location marker
          if (currentLocationMarker) {
            currentLocationMarker.setPosition(coordinates);
          } else {
            // Create new current location marker
            const newMarker = new window.google.maps.Marker({
              position: coordinates,
              map: map,
              title: 'Your Location',
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20),
                anchor: new window.google.maps.Point(10, 10)
              }
            });
            setCurrentLocationMarker(newMarker);
          }
          
          console.log('✅ Map location updated to:', coordinates);
        } catch (error) {
          console.error('Error updating map location:', error);
        }
      }
    };

    // Listen for custom location changed event
    window.addEventListener('locationChanged', handleLocationChanged);
    
    return () => {
      window.removeEventListener('locationChanged', handleLocationChanged);
    };
  }, [map, currentLocationMarker]);

  // Listen for page focus to refresh location when user returns
  useEffect(() => {
    const handlePageFocus = async () => {
      console.log('🔄 Page focused, checking for location updates...');
      
      // Only refresh if map is already initialized
      if (map && window.google) {
        try {
          const coordinates = await getCoordinates();
          
          // Check if location has changed by comparing with current map center
          const currentCenter = map.getCenter();
          if (currentCenter) {
            const currentLat = currentCenter.lat();
            const currentLng = currentCenter.lng();
            
            // If coordinates are significantly different, update the map
            const latDiff = Math.abs(currentLat - coordinates.lat);
            const lngDiff = Math.abs(currentLng - coordinates.lng);
            
            if (latDiff > 0.01 || lngDiff > 0.01) { // ~1km threshold
              console.log('📍 Location has changed, updating map...');
              
              // Update map center
              map.setCenter(coordinates);
              
              // Update current location marker
              if (currentLocationMarker) {
                currentLocationMarker.setPosition(coordinates);
              } else {
                // Create new current location marker
                const newMarker = new window.google.maps.Marker({
                  position: coordinates,
                  map: map,
                  title: 'Your Location',
                  icon: {
                    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(20, 20),
                    anchor: new window.google.maps.Point(10, 10)
                  }
                });
                setCurrentLocationMarker(newMarker);
              }
              
              console.log('✅ Map location updated on page focus to:', coordinates);
            } else {
              console.log('📍 Location unchanged, no map update needed');
            }
          }
        } catch (error) {
          console.error('Error checking location on page focus:', error);
        }
      }
    };

    // Listen for page focus events
    window.addEventListener('focus', handlePageFocus);
    window.addEventListener('pageshow', handlePageFocus);
    
    return () => {
      window.removeEventListener('focus', handlePageFocus);
      window.removeEventListener('pageshow', handlePageFocus);
    };
  }, [map, currentLocationMarker]);

  // Get current meal time based on specific hours (handles all US timezones)
  const getCurrentMealTime = (): string | null => {
    const now = new Date();
    
    // Convert to US Eastern Time (EDT/EST)
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();
    
    // Only trigger at specific times: 9am, 12pm, 5pm Eastern Time
    if (hour === 9 && minute === 0) {
      return 'breakfast';
    } else if (hour === 12 && minute === 0) {
      return 'lunch';
    } else if (hour === 17 && minute === 0) {
      return 'dinner';
    }
    
    return null;
  };

  // Check for meal-time notifications and set up meal-time search
  const checkMealTimeNotifications = async () => {
    try {
      console.log('🍽️ Checking meal-time notifications...');
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('❌ No authenticated user found');
        return;
      }

      console.log('✅ User authenticated:', user.id);
      const mealTime = getCurrentMealTime();
      console.log('🕐 Current meal time:', mealTime);
      setCurrentMealTime(mealTime);

      if (mealTime) {
        // Check if user has received meal-time notification today
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const { data: notifications, error: notificationError } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', `${mealTime}_reminder`)
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString())
          .limit(1);

        if (!notificationError && (!notifications || notifications.length === 0)) {
          // Create meal-time notification
          await checkAndCreateMealTimeNotification(user.id);
        }

        // Check if user came from a meal-time notification
        const mealTimeFromStorage = sessionStorage.getItem('mealTime');
        if (mealTimeFromStorage === mealTime) {
          setShowMealTimeNotification(true);
          // Auto-search for meal-time restaurants
          searchMealTimeRestaurants(mealTime);
        }
      }
    } catch (error) {
      console.error('Error checking meal-time notifications:', error);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  // Initialize Google Maps when script loads
  useEffect(() => {
    const initializeMap = async () => {
      if (mapRef.current && window.google && !map) {
        const coordinates = await getCoordinates();
        
        try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: coordinates,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
          }
        });

        // Check for event address from eventdetail page
        const eventAddress = sessionStorage.getItem('eventAddress');
        if (eventAddress) {
          // Geocode the event address and add a green pin
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: eventAddress }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const eventLocation = results[0].geometry.location;
              const placeId = results[0].place_id;
              
              // Get venue name from Google Places API
              let venueName = eventAddress; // fallback to address
              if (placeId) {
                const service = new window.google.maps.places.PlacesService(
                  document.createElement('div')
                );
                
                service.getDetails(
                  {
                    placeId: placeId,
                    fields: ['name', 'formatted_address']
                  },
                  (place, placeStatus) => {
                    if (placeStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                      venueName = place.name || eventAddress;
                    }
                    
                    // Create green pin marker for event location
                    const eventMarker = new window.google.maps.Marker({
                      position: eventLocation,
                      map: mapInstance,
                      title: venueName,
                      icon: {
                        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#ffffff" stroke-width="3"/>
                            <circle cx="20" cy="20" r="8" fill="#ffffff"/>
                            <circle cx="20" cy="20" r="4" fill="#10B981"/>
                          </svg>
                        `),
                        scaledSize: new window.google.maps.Size(40, 40),
                        anchor: new window.google.maps.Point(20, 20),
                      },
                      zIndex: 1000,
                    });

                    // Create info window for event location with venue details
                    const eventInfoWindow = new window.google.maps.InfoWindow({
                      content: `
                        <div style="
                          background: white; 
                          color: black; 
                          padding: 16px; 
                          border-radius: 12px; 
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                          border: 1px solid #e5e7eb;
                          min-width: 250px;
                          max-width: 300px;
                        ">
                          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #111827;">${venueName}</div>
                          <div style="font-size: 14px; color: #6b7280; margin-bottom: 16px; line-height: 1.4;">${eventAddress}</div>
                          <button 
                            onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(eventAddress)}', '_blank')"
                            style="
                              background: #10B981; 
                              color: white; 
                              border: none;
                              padding: 12px 20px; 
                              border-radius: 8px; 
                              font-weight: 600; 
                              font-size: 14px;
                              width: 100%;
                              cursor: pointer;
                              transition: background-color 0.2s;
                            "
                            onmouseover="this.style.backgroundColor='#059669'"
                            onmouseout="this.style.backgroundColor='#10B981'"
                          >
                            Get Directions
                          </button>
                        </div>
                      `,
                      disableAutoPan: true,
                    });

                    // Show info window when marker is clicked
                    eventMarker.addListener('click', () => {
                      eventInfoWindow.open(mapInstance, eventMarker);
                    });

                    // Center map on event location
                    mapInstance.setCenter(eventLocation);
                    mapInstance.setZoom(15);
                  }
                );
              } else {
                // Fallback if no place ID
                const eventMarker = new window.google.maps.Marker({
                  position: eventLocation,
                  map: mapInstance,
                  title: venueName,
                  icon: {
                    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#ffffff" stroke-width="3"/>
                        <circle cx="20" cy="20" r="8" fill="#ffffff"/>
                        <circle cx="20" cy="20" r="4" fill="#10B981"/>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 20),
                  },
                  zIndex: 1000,
                });

                const eventInfoWindow = new window.google.maps.InfoWindow({
                  content: `
                    <div style="
                      background: white; 
                      color: black; 
                      padding: 16px; 
                      border-radius: 12px; 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                      border: 1px solid #e5e7eb;
                      min-width: 250px;
                      max-width: 300px;
                    ">
                      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #111827;">${venueName}</div>
                      <div style="font-size: 14px; color: #6b7280; margin-bottom: 16px; line-height: 1.4;">Event Location</div>
                      <button 
                        onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(eventAddress)}', '_blank')"
                        style="
                          background: #10B981; 
                          color: white; 
                          border: none;
                          padding: 12px 20px; 
                          border-radius: 8px; 
                          font-weight: 600; 
                          font-size: 14px;
                          width: 100%;
                          cursor: pointer;
                          transition: background-color 0.2s;
                        "
                        onmouseover="this.style.backgroundColor='#059669'"
                        onmouseout="this.style.backgroundColor='#10B981'"
                      >
                        Get Directions
                      </button>
                    </div>
                  `,
                  disableAutoPan: true,
                });

                eventMarker.addListener('click', () => {
                  eventInfoWindow.open(mapInstance, eventMarker);
                });

                mapInstance.setCenter(eventLocation);
                mapInstance.setZoom(15);
              }
              
              // Clear the event address from sessionStorage
              sessionStorage.removeItem('eventAddress');
            }
          });
        }

          // Create a larger, more prominent current location marker
          const currentMarker = new window.google.maps.Marker({
            position: coordinates,
          map: mapInstance,
            title: "Your Location",
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#4285F4" stroke="#ffffff" stroke-width="3"/>
                  <circle cx="20" cy="20" r="8" fill="#ffffff"/>
                  <circle cx="20" cy="20" r="4" fill="#4285F4"/>
              </svg>
            `),
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20),
            },
            zIndex: 1000, // Ensure it's on top
          });

          // Create an info window with "This is you" message
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="
                background: #4285F4; 
                color: white; 
                padding: 8px 12px; 
                border-radius: 8px; 
                font-weight: 600; 
                font-size: 14px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                border: 2px solid white;
              ">
                This is you
              </div>
            `,
            disableAutoPan: true,
          });

          // Position the info window above the marker
          const offset = new window.google.maps.Size(0, -60);
          infoWindow.setPosition(coordinates);
          infoWindow.setOptions({
            pixelOffset: offset,
          });
          infoWindow.open(mapInstance);

          // Store the current location marker
          setCurrentLocationMarker(currentMarker);

        setMap(mapInstance);
        setMapError(null);
      } catch (error) {
          console.error('Error initializing map:', error);
        setMapError('Failed to initialize map');
      }
    }
    };

    if (isGoogleMapsLoaded) {
      initializeMap();
    } else {
      // Try to initialize immediately if Google Maps is already loaded
      if (window.google) {
        setIsGoogleMapsLoaded(true);
      }
    }
  }, [isGoogleMapsLoaded, map]);

  // Check available categories when map is ready
  useEffect(() => {
    if (map && isGoogleMapsLoaded) {
      checkAvailableCategories();
    }
  }, [map, isGoogleMapsLoaded]);

  // Check for meal-time notifications when map loads
  useEffect(() => {
    if (map && isGoogleMapsLoaded) {
      console.log('🗺️ Map loaded, checking meal-time notifications...');
      checkMealTimeNotifications();
    }
  }, [map, isGoogleMapsLoaded]);

  const handleSearchInputClick = () => {
    setShowBottomsheet(true);
    // Focus the input after bottomsheet opens
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 300);
  };

  // Search for places based on query
  const searchPlaces = async () => {
    if (!map || !window.google) return;
    
    const service = new window.google.maps.places.PlacesService(map);
    const coordinates = await getCoordinates();
    
    // Use a smaller radius for Google Places API to get fewer results, then filter strictly
    // Set minimum radius of 1000m (0.6 miles) to avoid Google Places API error
    const apiRadiusMeters = Math.max(distanceMiles * 1609.34, 1000); // Min 1km radius for API
    
    const request = {
      location: coordinates,
      radius: apiRadiusMeters,
      query: searchQuery,
      fields: ['name', 'geometry', 'vicinity', 'rating', 'types']
    };
    
    console.log(`🔍 Google Places API radius: ${(apiRadiusMeters/1609.34).toFixed(1)} miles (${apiRadiusMeters}m), but will filter to ${distanceMiles} miles`);

    service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        console.log('🔍 Google Places search results (before filtering):', results.length);
        
        // Add distance to each result and filter by distance slider
        const resultsWithDistance = results
          .map(place => {
            if (place.geometry?.location) {
              const placeCoords = getPlaceCoordinates(place);
              const distance = calculateDistance(
                coordinates.lat,
                coordinates.lng,
                placeCoords.lat,
                placeCoords.lng
              );
              return { ...place, distance };
            }
            return { ...place, distance: 0 };
          })
          .filter(place => {
            const distance = typeof place.distance === 'string' ? parseFloat(place.distance) : place.distance;
            const isWithinRange = distance <= distanceMiles;
            
            console.log(`📍 Google Place: ${place.name} - ${distance.toFixed(1)} miles (limit: ${distanceMiles} miles) - ${isWithinRange ? '✅ IN RANGE' : '❌ OUT OF RANGE'}`);
            
            if (!isWithinRange) {
              console.log(`🚫 FILTERED OUT: ${place.name} is ${distance.toFixed(1)} miles away, but distance slider is set to ${distanceMiles} miles`);
            }
            
            return isWithinRange;
          })
          .slice(0, 10); // Limit to 10 results after filtering
        
        console.log('✅ Google Places results after distance filtering:', resultsWithDistance.length);
        
        setSearchResults(resultsWithDistance);
        setShowSearchResults(true);
        // Load ratings for search results
        loadPlaceRatings(resultsWithDistance);
      } else {
        console.log('❌ Google Places search failed or no results');
        setSearchResults([]);
        setShowSearchResults(false);
      }
    });
  };


  // Location-aware search for specific chains and types
  const searchForPlaces = async (query: string) => {
    if (!map || !window.google) return;
    
    const coordinates = await getCoordinates();
    const service = new window.google.maps.places.PlacesService(map);
    
    // Check for wrestling promotions first - use distance slider for filtering
    console.log('🔍 Search query:', query);
    console.log('📍 YOUR LOCATION coordinates:', coordinates);
    console.log('📏 Distance slider setting:', distanceMiles, 'miles');
    console.log('📏 Distance slider type:', typeof distanceMiles);
    console.log('📏 Distance slider value check:', distanceMiles === 100, distanceMiles === '100', distanceMiles);
    console.log('🎯 Will show wrestling promotions within', distanceMiles, 'miles of YOUR location');
    
    const wrestlingPromotions = findWrestlingPromotions(query, coordinates, distanceMiles);
    if (wrestlingPromotions.length > 0) {
      console.log('🎭 Found wrestling promotions within', distanceMiles, 'miles:', wrestlingPromotions);
      
      // Convert wrestling promotions to place-like objects
      const wrestlingPlaces = wrestlingPromotions.map(promotion => ({
        place_id: `wrestling_${promotion.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: promotion.name,
        vicinity: promotion.location,
        formatted_address: promotion.location,
        geometry: {
          location: {
            lat: promotion.coordinates?.lat || 0,
            lng: promotion.coordinates?.lng || 0
          }
        },
        rating: 4.5, // Default rating for wrestling promotions
        types: ['establishment', 'gym', 'sports_complex'],
        isWrestlingPromotion: true
      }));
      
      setSearchResults(wrestlingPlaces);
      setShowSearchResults(true);
      setShowBottomsheet(true);
      return;
    } else {
      console.log('🎭 No wrestling promotions found within', distanceMiles, 'miles');
      console.log('🔄 Falling back to Google Places search with distance filtering');
    }
    
    // Map search terms to specific place types and keywords
    const searchMappings: { [key: string]: { type: string, keyword: string } } = {
      'burger': { type: 'restaurant', keyword: 'burger king mcdonalds' },
      'restaurant': { type: 'restaurant', keyword: 'restaurant food' },
      'hotel': { type: 'lodging', keyword: 'hotel motel' },
      'hotels': { type: 'lodging', keyword: 'hotel motel' },
      'club': { type: 'night_club', keyword: 'club bar' },
      'clubs': { type: 'night_club', keyword: 'club bar' },
      'gas': { type: 'gas_station', keyword: 'gas station fuel' },
      'gas station': { type: 'gas_station', keyword: 'gas station fuel' },
      'coffee': { type: 'cafe', keyword: 'starbucks dunkin coffee' },
      'starbucks': { type: 'cafe', keyword: 'starbucks' },
      'mcdonalds': { type: 'restaurant', keyword: 'mcdonalds' },
      'burger king': { type: 'restaurant', keyword: 'burger king' },
      'walmart': { type: 'store', keyword: 'walmart' },
      'target': { type: 'store', keyword: 'target' },
      'pharmacy': { type: 'pharmacy', keyword: 'cvs walgreens pharmacy' },
      'bank': { type: 'bank', keyword: 'bank atm' },
      'atm': { type: 'atm', keyword: 'atm bank' },
      // WRESTLING - Comprehensive search terms
      'wrestle': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      'wrestler': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      'wrestling': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      'pro wrestling': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      'njpw': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      'wwe': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      'aew': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      'arena': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      'dojo': { type: 'establishment', keyword: 'wrestling arena training gym dojo pro wrestling new japan wwe aew njpw' },
      
      // BOXING - Comprehensive search terms
      'boxing': { type: 'gym', keyword: 'boxing gym training club ring sparring' },
      'boxer': { type: 'gym', keyword: 'boxing gym training club ring sparring' },
      'box': { type: 'gym', keyword: 'boxing gym training club ring sparring' },
      
      // MMA - Comprehensive search terms
      'mma': { type: 'gym', keyword: 'mma gym training ufc cage fighting martial arts' },
      'ufc': { type: 'gym', keyword: 'mma gym training ufc cage fighting martial arts' },
      'martial arts': { type: 'gym', keyword: 'mma gym training ufc cage fighting martial arts' },
      'fighting': { type: 'gym', keyword: 'mma gym training ufc cage fighting martial arts' },
      
      // COMEDY - Comprehensive search terms
      'comedian': { type: 'night_club', keyword: 'comedy club stand up comedy venue' },
      'comedians': { type: 'night_club', keyword: 'comedy club stand up comedy venue' },
      'comedy': { type: 'night_club', keyword: 'comedy club stand up comedy venue' },
      'stand up': { type: 'night_club', keyword: 'comedy club stand up comedy venue' },
      'standup': { type: 'night_club', keyword: 'comedy club stand up comedy venue' },
      
      // MUSIC - Comprehensive search terms
      'musician': { type: 'establishment', keyword: 'music venue studio concert hall recording' },
      'musicians': { type: 'establishment', keyword: 'music venue studio concert hall recording' },
      'music': { type: 'establishment', keyword: 'music venue studio concert hall recording' },
      'concert': { type: 'establishment', keyword: 'music venue studio concert hall recording' },
      'venue': { type: 'establishment', keyword: 'music venue studio concert hall recording' },
      'studio': { type: 'establishment', keyword: 'music venue studio concert hall recording' },
      'recording': { type: 'establishment', keyword: 'music venue studio concert hall recording' },
      
      // GENERAL ENTERTAINMENT
      'entertainment': { type: 'establishment', keyword: 'entertainment venue theater show' },
      'theater': { type: 'establishment', keyword: 'entertainment venue theater show' },
      'show': { type: 'establishment', keyword: 'entertainment venue theater show' },
      'performance': { type: 'establishment', keyword: 'entertainment venue theater show' }
    };

    const lowerQuery = query.toLowerCase().trim();
    const mapping = searchMappings[lowerQuery] || { type: 'establishment', keyword: query };

    // Use a smaller radius for Google Places API to get fewer results, then filter strictly
    // Set minimum radius of 1000m (0.6 miles) to avoid Google Places API error
    const apiRadiusMeters = Math.max(distanceMiles * 1609.34, 1000); // Min 1km radius for API
    
    const request = {
      location: coordinates,
      radius: apiRadiusMeters,
      type: mapping.type,
      keyword: mapping.keyword
    };
    
    console.log(`🔍 Searching for "${query}" - API radius: ${(apiRadiusMeters/1609.34).toFixed(1)} miles (${apiRadiusMeters}m), will filter to ${distanceMiles} miles`);

    // Perform multiple searches for better coverage
    const performMultipleSearches = async () => {
      const allResults: google.maps.places.PlaceResult[] = [];
      const seenPlaceIds = new Set<string>();
      
      // Search 1: Primary search with mapped keywords
      const search1 = new Promise<void>((resolve) => {
        service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach(place => {
              if (place.place_id && !seenPlaceIds.has(place.place_id)) {
                seenPlaceIds.add(place.place_id);
                allResults.push(place);
              }
            });
          }
          resolve();
        });
      });
      
      // Search 2: Text search for broader results
      const search2 = new Promise<void>((resolve) => {
        const textSearchRequest = {
          query: `${mapping.keyword} near ${coordinates.lat},${coordinates.lng}`,
          location: coordinates,
          radius: apiRadiusMeters
        };
        
        service.textSearch(textSearchRequest, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach(place => {
              if (place.place_id && !seenPlaceIds.has(place.place_id)) {
                seenPlaceIds.add(place.place_id);
                allResults.push(place);
              }
            });
          }
          resolve();
        });
      });
      
      // Search 3: Additional keyword variations for talent categories
      let search3 = Promise.resolve();
      if (['wrestle', 'wrestler', 'wrestling', 'pro wrestling', 'njpw', 'wwe', 'aew'].includes(lowerQuery)) {
        search3 = new Promise<void>((resolve) => {
          const wrestlingRequest = {
            location: coordinates,
            radius: apiRadiusMeters,
            type: 'establishment',
            keyword: 'wrestling training gym dojo martial arts'
          };
          
          service.nearbySearch(wrestlingRequest, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              results.forEach(place => {
                if (place.place_id && !seenPlaceIds.has(place.place_id)) {
                  seenPlaceIds.add(place.place_id);
                  allResults.push(place);
                }
              });
            }
            resolve();
          });
        });
      }
      
      // Wait for all searches to complete
      await Promise.all([search1, search2, search3]);
      
      console.log(`🔍 Google Places search results (before distance filtering): ${allResults.length}`);
      
      // Filter results by distance and add distance information
      const resultsWithDistance = allResults
          .map(place => {
            if (place.geometry?.location) {
              const placeCoords = getPlaceCoordinates(place);
              const distance = calculateDistance(
                coordinates.lat,
                coordinates.lng,
                placeCoords.lat,
                placeCoords.lng
              );
              return { ...place, distance: parseFloat(distance) };
            }
          return { ...place, distance: 0 };
        })
        .filter(place => {
          const isWithinRange = place.distance <= distanceMiles;
          console.log(`📍 Google Place: ${place.name} - ${place.distance.toFixed(1)} miles (limit: ${distanceMiles} miles) - ${isWithinRange ? '✅ IN RANGE' : '❌ OUT OF RANGE'}`);
          
          if (!isWithinRange) {
            console.log(`🚫 FILTERED OUT: ${place.name} is ${place.distance.toFixed(1)} miles away, but distance slider is set to ${distanceMiles} miles`);
          }
          
          return isWithinRange;
        });
      
      // Sort results by rating (highest first) and limit to 20 results
      const sortedResults = resultsWithDistance
        .filter(place => place.rating !== undefined)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 20);
      
      console.log(`✅ Found ${sortedResults.length} results within ${distanceMiles} miles for "${query}"`);
      
      // Clear existing markers and set results
      clearMarkers();
      setSearchResults(sortedResults);
      setShowSearchResults(true);
      loadPlaceRatings(sortedResults);
    };
    
    performMultipleSearches();
  };



  // Handle distance slider change
  const handleDistanceChange = async (value: number) => {
    setDistanceMiles(value);
    
    // Save to Supabase if user is authenticated
    if (currentUserId) {
      try {
        await updateUserDistancePreference(currentUserId, value);
        console.log('✅ Distance preference saved:', value);
      } catch (error) {
        console.error('❌ Error saving distance preference:', error);
      }
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchQuery.length >= 2) {
      searchForPlaces(searchQuery.trim());
    }
  };

  // Clear all markers except current location marker
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Clear current location marker
  const clearCurrentLocationMarker = () => {
    if (currentLocationMarker) {
      currentLocationMarker.setMap(null);
      setCurrentLocationMarker(null);
    }
  };

  // Check which categories have nearby places
  const checkAvailableCategories = async () => {
    if (!map) return;
    
    const coordinates = await getCoordinates();
    const service = new window.google.maps.places.PlacesService(map);
    const categories = [
      { type: 'restaurant', keyword: 'food' },
      { type: 'lodging', keyword: 'hotels' },
      { type: 'stadium', keyword: 'stadiums' },
      { type: 'night_club', keyword: 'clubs' },
      { type: 'establishment', keyword: 'events' },
      { type: 'gas_station', keyword: 'gas stations' },
      // Talent-specific categories
      { type: 'establishment', keyword: 'wrestling' },
      { type: 'gym', keyword: 'boxing' },
      { type: 'gym', keyword: 'mma' },
      { type: 'night_club', keyword: 'comedians' },
      { type: 'establishment', keyword: 'musicians' }
    ];

    const availableCategoriesList: string[] = [];

    // Check each category
    for (const category of categories) {
      try {
        const request = {
          location: coordinates,
          radius: 5000, // 5km radius
          type: category.type,
          keyword: category.keyword
        };

        await new Promise<void>((resolve) => {
          service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
              availableCategoriesList.push(category.keyword);
            }
            resolve();
          });
        });
      } catch (error) {
        console.warn(`Error checking category ${category.keyword}:`, error);
      }
    }

    // Always add "Recently Searched" as the first category
    availableCategoriesList.unshift('Recently Searched');
    
    setAvailableCategories(availableCategoriesList);
    setIsCheckingCategories(false);
  };

  // Search for meal-time restaurants with food icons
  const searchMealTimeRestaurants = async (mealTime: string) => {
    if (!map) return;
    
    const coordinates = await getCoordinates();
    const service = new window.google.maps.places.PlacesService(map);
    
    // Define meal-time specific keywords
    const mealKeywords = {
      breakfast: 'breakfast restaurant cafe diner',
      lunch: 'lunch restaurant food',
      dinner: 'dinner restaurant fine dining'
    };
    
    const request = {
      location: coordinates,
      radius: 5000, // 5km radius
      type: 'restaurant',
      keyword: mealKeywords[mealTime as keyof typeof mealKeywords] || 'restaurant'
    };

    service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Clear existing markers
        clearMarkers();
        
        // Add markers for found places with food icons
        results.slice(0, 10).forEach((place: google.maps.places.PlaceResult) => {
          if (place.geometry?.location) {
            const newMarker = new window.google.maps.Marker({
              position: place.geometry.location,
              map: map,
              title: place.name,
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#FF6B6B" stroke="#ffffff" stroke-width="2"/>
                    <path d="M8 10h8v4H8v-4z" fill="#ffffff"/>
                    <path d="M10 8v8M14 8v8" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(24, 24),
              }
            });
            
            // Add click listener to marker
            newMarker.addListener('click', async () => {
              // Mark place as selected
              await markPlaceAsSelected(place);
              
              // Refresh recent places to show the new addition
              await loadRecentPlaces();
              
              setSelectedPlace(place);
              setShowDirectionsPopup(true);
            });
            
            markersRef.current.push(newMarker);
          }
        });
        
        // Fit map to show all markers
        if (results.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          results.slice(0, 10).forEach((place: google.maps.places.PlaceResult) => {
            if (place.geometry?.location) {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        }
      }
    });
  };

  // Search for nearby places
  const searchNearby = async (type: string, keyword: string) => {
    if (!map) return;
    
    const coordinates = await getCoordinates();
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: coordinates,
      radius: distanceMiles * 1609.34, // Convert miles to meters
      type: type,
      keyword: keyword
    };

    service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Clear existing markers
        clearMarkers();
        
        // Add markers for found places
        results.slice(0, 10).forEach((place: google.maps.places.PlaceResult) => {
          if (place.geometry?.location) {
            const newMarker = new window.google.maps.Marker({
              position: place.geometry.location,
              map: map,
              title: place.name,
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4285F4"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20),
              }
            });
            
            // Add click listener to marker
            newMarker.addListener('click', async () => {
              // Mark place as selected
              await markPlaceAsSelected(place);
              
              // Refresh recent places to show the new addition
              await loadRecentPlaces();
              
              setSelectedPlace(place);
              setShowDirectionsPopup(true);
            });
            
            markersRef.current.push(newMarker);
          }
        });
        
        // Fit map to show all markers
        if (results.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          results.forEach((place: google.maps.places.PlaceResult) => {
            if (place.geometry?.location) {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        }
        
        // Add distance to nearby places
        const placesWithDistance = results.slice(0, 10).map(place => {
          if (place.geometry?.location) {
            const placeCoords = getPlaceCoordinates(place);
            const distance = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              placeCoords.lat,
              placeCoords.lng
            );
            return { ...place, distance };
          }
          return { ...place, distance: '0.0' };
        });
        
        setNearbyPlaces(placesWithDistance);
        setSelectedCategory(keyword);
        // Load ratings for nearby places
        loadPlaceRatings(placesWithDistance);
      }
    });
  };

  // Search for talent-specific locations
  const searchTalentLocations = async (talentType: string) => {
    if (!map) return;
    
    const coordinates = await getCoordinates();
    const service = new window.google.maps.places.PlacesService(map);
    
    // Define search terms for each talent type
    const talentSearchTerms: { [key: string]: { types: string[], keywords: string[] } } = {
      'wrestling': {
        types: ['establishment', 'gym'],
        keywords: ['wrestling', 'wrestler', 'arena', 'training', 'MCW', 'WWE', 'professional wrestling']
      },
      'boxing': {
        types: ['gym', 'establishment'],
        keywords: ['boxing', 'boxer', 'gym', 'training', 'ring', 'boxing club', 'martial arts']
      },
      'mma': {
        types: ['gym', 'establishment'],
        keywords: ['MMA', 'mixed martial arts', 'UFC', 'fighting', 'martial arts', 'training', 'cage']
      },
      'comedians': {
        types: ['establishment', 'night_club'],
        keywords: ['comedy', 'comedian', 'comedy club', 'stand up', 'comedy show', 'laugh', 'joke']
      },
      'musicians': {
        types: ['establishment', 'night_club'],
        keywords: ['music', 'musician', 'concert', 'venue', 'studio', 'recording', 'band', 'live music']
      }
    };

    const searchConfig = talentSearchTerms[talentType];
    if (!searchConfig) return;

    // Clear existing markers
    clearMarkers();
    
    let allResults: google.maps.places.PlaceResult[] = [];
    let completedSearches = 0;
    const totalSearches = searchConfig.types.length * searchConfig.keywords.length;

    // Search for each combination of type and keyword
    searchConfig.types.forEach(type => {
      searchConfig.keywords.forEach(keyword => {
        const request = {
          location: coordinates,
          radius: 10000, // 10km radius for talent locations
          type: type,
          keyword: keyword
        };

        service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          completedSearches++;
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            // Add unique results (avoid duplicates)
            results.forEach(place => {
              if (!allResults.find(existing => existing.place_id === place.place_id)) {
                allResults.push(place);
              }
            });
          }

          // When all searches are complete, process results
          if (completedSearches === totalSearches) {
            processTalentSearchResults(allResults, talentType);
          }
        });
      });
    });
  };

  // Process and display talent search results
  const processTalentSearchResults = async (results: google.maps.places.PlaceResult[], talentType: string) => {
    if (results.length === 0) {
      // If no specific results, try a broader search
      const coordinates = await getCoordinates();
      const service = new window.google.maps.places.PlacesService(map!);
      
      const request = {
        location: coordinates,
        radius: 15000, // 15km radius for broader search
        query: talentType === 'wrestling' ? 'wrestling arena' : 
               talentType === 'boxing' ? 'boxing gym' :
               talentType === 'mma' ? 'MMA gym' :
               talentType === 'comedians' ? 'comedy club' :
               'music venue'
      };

      service.textSearch(request, (textResults: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && textResults) {
          displayTalentResults(textResults.slice(0, 15), talentType);
        } else {
          // Show message if no results found
          setSearchResults([]);
          setShowSearchResults(true);
        }
      });
    } else {
      displayTalentResults(results.slice(0, 15), talentType);
    }
  };

  // Display talent search results
  const displayTalentResults = async (results: google.maps.places.PlaceResult[], talentType: string) => {
    const coordinates = await getCoordinates();
    
    // Add markers for found places
    results.forEach((place: google.maps.places.PlaceResult) => {
      if (place.geometry?.location) {
        const newMarker = new window.google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: place.name,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF6B6B"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(20, 20),
            anchor: new window.google.maps.Point(10, 10)
          }
        });

        newMarker.addListener('click', async () => {
          // Mark place as selected
          await markPlaceAsSelected(place);
          
          // Refresh recent places to show the new addition
          await loadRecentPlaces();
          
          setSelectedPlace(place);
          setShowDirectionsPopup(true);
        });

        markersRef.current.push(newMarker);
      }
    });

    // Update results with distance
    const placesWithDistance = results.map(place => {
      if (place.geometry?.location) {
        const placeCoords = getPlaceCoordinates(place);
        const distance = calculateDistance(
          coordinates.lat,
          coordinates.lng,
          placeCoords.lat,
          placeCoords.lng
        );
        return { ...place, distance };
      }
      return place;
    });

    setNearbyPlaces(placesWithDistance);
    setShowSearchResults(true);
    setSearchResults(placesWithDistance);
    
    // Load place ratings for display
    loadPlaceRatings(placesWithDistance);
  };

  const allQuickActions = [
    { 
      icon: "🕒", 
      label: "Recently Searched", 
      keyword: "Recently Searched",
      action: () => {
        console.log('🕒 Recently Searched clicked, recentPlaces:', recentPlaces);
        setSelectedCategory('Recently Searched');
        const convertedPlaces = recentPlaces.map(recentPlaceToPlaceData);
        console.log('🔄 Converted places:', convertedPlaces);
        setNearbyPlaces(convertedPlaces);
      },
      description: "Places you've recently searched and reviewed"
    },
    { 
      icon: "🍕", 
      label: "Food", 
      keyword: "food",
      action: () => searchNearby('restaurant', 'food'),
      description: "Restaurants & cafes nearby"
    },
    { 
      icon: "🏨", 
      label: "Hotels", 
      keyword: "hotels",
      action: () => searchNearby('lodging', 'hotels'),
      description: "Hotels & accommodations"
    },
    { 
      icon: "🏟️", 
      label: "Stadiums", 
      keyword: "stadiums",
      action: () => searchNearby('stadium', 'stadiums'),
      description: "Sports venues & stadiums"
    },
    { 
      icon: "🎉", 
      label: "Clubs", 
      keyword: "clubs",
      action: () => searchNearby('night_club', 'clubs'),
      description: "Nightlife & entertainment"
    },
    { 
      icon: "🎪", 
      label: "Events", 
      keyword: "events",
      action: () => searchNearby('establishment', 'events'),
      description: "Local events & activities"
    },
    { 
      icon: "⛽", 
      label: "Gas stations", 
      keyword: "gas stations",
      action: () => searchNearby('gas_station', 'gas stations'),
      description: "Fuel & gas stations"
    },
    // Talent-specific groups
    { 
      icon: "🤼", 
      label: "Wrestling", 
      keyword: "wrestling",
      action: () => searchTalentLocations('wrestling'),
      description: "Wrestling arenas & training facilities"
    },
    { 
      icon: "🥊", 
      label: "Boxing", 
      keyword: "boxing",
      action: () => searchTalentLocations('boxing'),
      description: "Boxing gyms & arenas"
    },
    { 
      icon: "🥋", 
      label: "MMA", 
      keyword: "mma",
      action: () => searchTalentLocations('mma'),
      description: "MMA gyms & training centers"
    },
    { 
      icon: "🎭", 
      label: "Comedians", 
      keyword: "comedians",
      action: () => searchTalentLocations('comedians'),
      description: "Comedy clubs & venues"
    },
    { 
      icon: "🎵", 
      label: "Musicians", 
      keyword: "musicians",
      action: () => searchTalentLocations('musicians'),
      description: "Music venues & studios"
    }
  ];

  // Filter quick actions to only show available categories
  const quickActions = allQuickActions.filter(action => 
    availableCategories.includes(action.keyword)
  );

  return (
    <div className="flex h-screen flex-col bg-background text-text-primary">
      {/* Google Maps Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsGoogleMapsLoaded(true)}
      />

      {/* Map - Full Width */}
      <div className="flex-1 relative h-full">
        {!isGoogleMapsLoaded ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading map...</p>
            </div>
          </div>
        ) : mapError ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <div className="text-button-red text-4xl mb-4">⚠️</div>
              <p className="text-text-primary font-medium mb-2">Map Error</p>
              <p className="text-text-secondary">{mapError}</p>
            </div>
          </div>
        ) : (
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: '100%',
              minHeight: '400px'
            }} 
          />
        )}

        {/* Meal-time Notification Banner */}
        {showMealTimeNotification && currentMealTime && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {currentMealTime === 'breakfast' ? '🌅' : currentMealTime === 'lunch' ? '☀️' : '🌙'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {currentMealTime === 'breakfast' ? 'Good Morning!' : 
                     currentMealTime === 'lunch' ? 'Lunch Time!' : 'Dinner Time!'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {currentMealTime === 'breakfast' ? 'Find breakfast spots near you' :
                     currentMealTime === 'lunch' ? 'Discover great lunch options' : 
                     'End your day with a delicious meal'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMealTimeNotification(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}


        {/* Floating Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-white rounded-lg shadow-lg px-4 py-3 flex items-center space-x-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Where to?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={handleSearchInputClick}
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none"
              readOnly
            />
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bottomsheet - Fixed at bottom */}
      {showBottomsheet && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30" onClick={() => setShowBottomsheet(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] transform transition-transform duration-300 ease-out flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4 flex-shrink-0"></div>
            
            {/* Search Input - Fixed at top */}
            <div className="px-6 pb-4 flex-shrink-0">
              <div className="flex space-x-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 outline-none"
                />
                <button
                  onClick={handleSearchClick}
                  disabled={searchQuery.length < 2}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>
              
              {/* Distance Slider */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search Radius
                  </label>
                  <span className="text-sm text-gray-600">
                    {distanceMiles} miles
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={distanceMiles}
                    onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${distanceMiles}%, #E5E7EB ${distanceMiles}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 mi</span>
                    <span>100 mi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Show selected place if returning from placefeedback */}
              {selectedPlace && !showSearchResults && !selectedCategory ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Place Details
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {selectedPlace.name}
                        </h4>
                        <p className="text-gray-600 text-sm mb-2">
                          {selectedPlace.vicinity || selectedPlace.formatted_address || 'Address not available'}
                        </p>
                        
                        {/* Rating and Comments */}
                        <div className="flex items-center space-x-4 mb-3">
                          {(() => {
                            const placeId = generatePlaceId(selectedPlace);
                            const rating = placeRatings[placeId];
                            const averageRating = rating?.average_rating || 0;
                            const commentCount = rating?.total_comments || 0;
                            
                            return (
                              <>
                                {averageRating > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-yellow-500">⭐</span>
                                    <span className="text-gray-600 text-sm">{averageRating.toFixed(1)}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-gray-600 text-sm">{commentCount}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setShowDirectionsPopup(true);
                            }}
                            className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Get Directions
                          </button>
                          <button
                            onClick={() => {
                              navigateToPlaceFeedback(selectedPlace);
                            }}
                            className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Add Feedback
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Back to search button */}
                  <button
                    onClick={() => {
                      setSelectedPlace(null);
                      setShowBottomsheet(false);
                    }}
                    className="w-full py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : showSearchResults ? (
                <div>
                  {/* Back button */}
                  <button
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchResults([]);
                      setSearchQuery("");
                      clearMarkers();
                    }}
                    className="flex items-center space-x-2 mb-4 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Clear search</span>
                  </button>
                  
                  {/* Search results list */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Search
                    </h3>
                    {searchResults.length > 0 ? (
                      searchResults.map((place, index) => (
                        <div
                          key={index}
                          className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          onClick={() => {
                          // Create a marker for this place on the map
                          if (place.geometry?.location && map) {
                            // Clear existing markers
                            clearMarkers();
                            
                            // Create a new marker for the selected place
                            const { lat, lng } = getPlaceCoordinates(place);
                            const newMarker = new window.google.maps.Marker({
                              position: new window.google.maps.LatLng(lat, lng),
                              map: map,
                              title: place.name,
                              icon: {
                                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6"/>
                                    <circle cx="12" cy="9" r="3" fill="white"/>
                                  </svg>
                                `),
                                scaledSize: new window.google.maps.Size(32, 32),
                                anchor: new window.google.maps.Point(16, 16)
                              }
                            });
                            
                            // Add click listener to marker
                            newMarker.addListener('click', async () => {
                              // Mark place as selected
                              await markPlaceAsSelected(place);
                              
                              setSelectedPlace(place);
                              setShowDirectionsPopup(true);
                            });
                            
                            markersRef.current.push(newMarker);
                            
                            // Center map on the selected place (reuse lat, lng variables)
                            map.setCenter(new window.google.maps.LatLng(lat, lng));
                            map.setZoom(15);
                          }
                          
                          // Close bottom sheet and clear search results
                          setShowBottomsheet(false);
                          setShowSearchResults(false);
                          setSearchResults([]);
                        }}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-900 font-medium">{place.name}</div>
                          <div className="text-gray-500 text-sm">{place.vicinity}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            {place.rating && (
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-gray-600 text-sm">{place.rating}</span>
                              </div>
                            )}
                            {place.distance && (
                              <div className="text-gray-600 text-sm">
                                {place.distance} mi
                              </div>
                            )}
                            {/* Comments Count */}
                            {(() => {
                              const placeId = generatePlaceId(place);
                              const rating = placeRatings[placeId];
                              const commentCount = rating?.total_comments || 0;
                              return (
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-gray-600 text-sm">{commentCount}</span>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Add Feedback Button - Moved to bottom */}
                          <div className="mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToPlaceFeedback(place);
                              }}
                              className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Add Feedback
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-500 text-sm">
                          No places found within {distanceMiles} miles. Try increasing your search radius or searching for different terms.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedCategory ? (
                <div>
                  {/* Back button */}
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setNearbyPlaces([]);
                      clearMarkers();
                    }}
                    className="flex items-center space-x-2 mb-4 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to categories</span>
                  </button>
                  
                  {/* Nearby places list */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {selectedCategory} nearby
                    </h3>
                    {nearbyPlaces.map((place, index) => (
                      <div
                        key={index}
                        className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        onClick={async () => {
                          // Mark place as selected
                          await markPlaceAsSelected(place);
                          
                          // Refresh recent places to show the new addition
                          await loadRecentPlaces();
                          
                          setSelectedPlace(place);
                          setShowDirectionsPopup(true);
                          setShowBottomsheet(false);
                        }}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-900 font-medium">{place.name}</div>
                          <div className="text-gray-500 text-sm">{place.vicinity}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            {place.rating && (
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-gray-600 text-sm">{place.rating}</span>
                              </div>
                            )}
                            {place.distance && (
                              <div className="text-gray-600 text-sm">
                                {place.distance} mi
                              </div>
                            )}
                            {/* Comments Count */}
                            {(() => {
                              const placeId = generatePlaceId(place);
                              const rating = placeRatings[placeId];
                              const commentCount = rating?.total_comments || 0;
                              return (
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-gray-600 text-sm">{commentCount}</span>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Add Feedback Button - Moved to bottom */}
                          <div className="mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToPlaceFeedback(place);
                              }}
                              className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Add Feedback
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search Results Section */}
                  {showSearchResults && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Search</h3>
                      <div className="space-y-2">
                        {searchResults.length > 0 ? (
                          searchResults.map((place, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              // Create a marker for this place on the map
                              if (place.geometry?.location && map) {
                                // Clear existing markers
                                clearMarkers();
                                
                                // Create a new marker for the selected place
                                const { lat, lng } = getPlaceCoordinates(place);
                                const newMarker = new window.google.maps.Marker({
                                  position: new window.google.maps.LatLng(lat, lng),
                                  map: map,
                                  title: place.name,
                                  icon: {
                                    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" fill="${place.isWrestlingPromotion ? '#DC2626' : '#3B82F6'}" stroke="white" stroke-width="2"/>
                                        ${place.isWrestlingPromotion ? 
                                          '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="white"/>' :
                                          '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/><circle cx="12" cy="9" r="3" fill="white"/>'
                                        }
                                      </svg>
                                    `),
                                    scaledSize: new window.google.maps.Size(32, 32),
                                    anchor: new window.google.maps.Point(16, 16)
                                  }
                                });
                                
                                // Add click listener to marker
                                newMarker.addListener('click', async () => {
                                  // Mark place as selected
                                  await markPlaceAsSelected(place);
                                  
                                  setSelectedPlace(place);
                                  setShowDirectionsPopup(true);
                                });
                                
                                markersRef.current.push(newMarker);
                                
                                // Center map on the selected place (reuse lat, lng variables)
                                map.setCenter(new window.google.maps.LatLng(lat, lng));
                                map.setZoom(15);
                              }
                              
                              // Close bottom sheet and clear search results
                              setShowBottomsheet(false);
                              setShowSearchResults(false);
                              setSearchResults([]);
                            }}
                            className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              place.isWrestlingPromotion ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {place.isWrestlingPromotion ? (
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-gray-900 font-medium">{place.name}</div>
                              <div className="text-gray-500 text-sm">{place.vicinity}</div>
                              {place.isWrestlingPromotion && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">Wrestling Promotion</span>
                                </div>
                              )}
                              {place.rating && !place.isWrestlingPromotion && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <span className="text-yellow-500">⭐</span>
                                  <span className="text-gray-600 text-sm">{place.rating}</span>
                                </div>
                              )}
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                            <p className="text-gray-500 text-sm">
                              No places found within {distanceMiles} miles. Try increasing your search radius or searching for different terms.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Groups Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Groups</h3>
            <div className="space-y-2">
                      {isCheckingCategories ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-500 text-sm">Finding nearby places...</p>
                          </div>
                        </div>
                      ) : quickActions.length > 0 ? (
                        quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                  }}
                            className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <div className="flex-1 text-left">
                              <div className="text-gray-900 font-medium">{action.label}</div>
                    {action.description && (
                                <div className="text-gray-500 text-sm">{action.description}</div>
                              )}
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-500 text-sm">
                            No nearby places found in your area.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Directions Popup */}
      {showDirectionsPopup && selectedPlace && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedPlace.name}
              </h3>
              
              <p className="text-gray-600 mb-2 text-sm">
                {selectedPlace.vicinity || selectedPlace.formatted_address || 'Address not available'}
              </p>
              
              <p className="text-gray-500 mb-4 text-sm">
                Get directions in Google Maps
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDirectionsPopup(false);
                    setSelectedPlace(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const { lat, lng } = getPlaceCoordinates(selectedPlace);
                    if (lat && lng) {
                      // Use same behavior as desktop - open in web browser
                      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                      window.open(webUrl, '_blank');
                    }
                    setShowDirectionsPopup(false);
                    setSelectedPlace(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open in Google Maps
                </button>
              </div>
              
              {/* Additional option for all users */}
              <div className="mt-3">
                <button
                  onClick={() => {
                    const { lat, lng } = getPlaceCoordinates(selectedPlace);
                    if (lat && lng) {
                      // Open in new tab with directions
                      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                      window.open(webUrl, '_blank');
                    }
                    setShowDirectionsPopup(false);
                    setSelectedPlace(null);
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Open in New Tab
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}


      {/* Add Feedback Modal */}
      {showAddFeedback && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Feedback</h3>
              <p className="text-gray-600">Share your experience about places you've visited</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowAddFeedback(false);
                  // Navigate to a general feedback page with a placeholder
                  const params = new URLSearchParams({
                    placeId: 'general_feedback',
                    placeName: 'General Feedback',
                    placeAddress: 'Add feedback for any place you\'ve visited'
                  });
                  router.push(`/placefeedback?${params.toString()}`);
                }}
                className="w-full bg-button-red text-white py-3 px-4 rounded-lg font-semibold hover:bg-button-red-hover transition-colors"
              >
                Add General Feedback
              </button>
              
              <button
                onClick={() => setShowAddFeedback(false)}
                className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <Navigation />
    </div>
  );
}
