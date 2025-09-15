"use client";

import Navigation from "../components/Navigation";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";

// Declare global google type
declare global {
  interface Window {
    google: typeof google;
  }
}


export default function MapPage() {
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
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

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

  // Open maps in native app or web
  const openMapsApp = (lat: number, lng: number, placeName: string) => {
    const encodedPlaceName = encodeURIComponent(placeName);
    let url = '';

    if (isIOS()) {
      // Try Google Maps app first, fallback to Apple Maps
      url = `comgooglemaps://?q=${encodedPlaceName}&center=${lat},${lng}&zoom=14`;
      
      // Create a hidden iframe to test if Google Maps app is installed
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      // If Google Maps app doesn't open, fallback to Apple Maps
      setTimeout(() => {
        document.body.removeChild(iframe);
        // Fallback to Apple Maps
        const appleMapsUrl = `maps://maps.apple.com/?q=${encodedPlaceName}&ll=${lat},${lng}`;
        window.location.href = appleMapsUrl;
      }, 1000);
      
    } else if (isAndroid()) {
      // Android - use geo: scheme for Google Maps
      url = `geo:${lat},${lng}?q=${lat},${lng}(${encodedPlaceName})`;
      window.location.href = url;
    } else {
      // Desktop or other devices - use web version
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  // Get coordinates from localStorage (same as locationreview)
  const getCoordinates = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('userLocation');
        if (stored) {
          const location = JSON.parse(stored);
          if (location.lat && location.lng) {
            return { lat: location.lat, lng: location.lng };
          }
        }
      } catch (error) {
        console.error('Error parsing stored location:', error);
      }
    }

    // Fallback to NYC
    return { lat: 40.7128, lng: -74.0060 };
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
    const initializeMap = () => {
      if (mapRef.current && window.google && !map) {
        const coordinates = getCoordinates();
        
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
    if (!map || !window.google || searchQuery.length < 2) return;
    
    const service = new window.google.maps.places.PlacesService(map);
    const coordinates = getCoordinates();
    
    const request = {
      location: coordinates,
      radius: 10000, // 10km radius
      query: searchQuery,
      fields: ['name', 'geometry', 'vicinity', 'rating', 'types']
    };

    service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Add distance to each result
        const resultsWithDistance = results.slice(0, 10).map(place => {
          if (place.geometry?.location) {
            const distance = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              place.geometry.location.lat(),
              place.geometry.location.lng()
            );
            return { ...place, distance };
          }
          return { ...place, distance: '0.0' };
        });
        
        setSearchResults(resultsWithDistance);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    });
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchQuery.length >= 2) {
      searchPlaces();
    }
  };

  // Location-aware search for specific chains and types
  const searchForPlaces = async (query: string) => {
    if (!map || !window.google) return;
    
    const coordinates = getCoordinates();
    const service = new window.google.maps.places.PlacesService(map);
    
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
      'atm': { type: 'atm', keyword: 'atm bank' }
    };

    const lowerQuery = query.toLowerCase().trim();
    const mapping = searchMappings[lowerQuery] || { type: 'establishment', keyword: query };

    const request = {
      location: coordinates,
      radius: 10000, // 10km radius
      type: mapping.type,
      keyword: mapping.keyword
    };

    service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Clear existing markers
        clearMarkers();
        
        // Add markers for found places
        results.slice(0, 15).forEach((place: google.maps.places.PlaceResult) => {
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
            newMarker.addListener('click', () => {
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
        
        setSearchResults(results.slice(0, 15));
        setShowSearchResults(true);
        setShowBottomsheet(false);
      }
    });
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
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
    
    const coordinates = getCoordinates();
    const service = new window.google.maps.places.PlacesService(map);
    const categories = [
      { type: 'restaurant', keyword: 'food' },
      { type: 'lodging', keyword: 'hotels' },
      { type: 'stadium', keyword: 'stadiums' },
      { type: 'night_club', keyword: 'clubs' },
      { type: 'establishment', keyword: 'events' },
      { type: 'gas_station', keyword: 'gas stations' }
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

    setAvailableCategories(availableCategoriesList);
    setIsCheckingCategories(false);
  };

  // Search for nearby places
  const searchNearby = (type: string, keyword: string) => {
    if (!map) return;
    
    const coordinates = getCoordinates();
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: coordinates,
      radius: 5000, // 5km radius
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
            newMarker.addListener('click', () => {
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
            const distance = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              place.geometry.location.lat(),
              place.geometry.location.lng()
            );
            return { ...place, distance };
          }
          return { ...place, distance: '0.0' };
        });
        
        setNearbyPlaces(placesWithDistance);
        setSelectedCategory(keyword);
      }
    });
  };

  const allQuickActions = [
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
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Show search results if searching */}
              {showSearchResults ? (
                <div>
                  {/* Back button */}
                  <button
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchResults([]);
                      clearMarkers();
                    }}
                    className="flex items-center space-x-2 mb-4 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to search</span>
                  </button>
                  
                  {/* Search results list */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Search
                    </h3>
                    {searchResults.map((place, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedPlace(place);
                          setShowDirectionsPopup(true);
                          setShowBottomsheet(false);
                        }}
                        className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
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
                                {place.distance} mi away
                              </div>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
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
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedPlace(place);
                          setShowDirectionsPopup(true);
                          setShowBottomsheet(false);
                        }}
                        className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
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
                                {place.distance} mi away
                              </div>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
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
                        {searchResults.map((place, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedPlace(place);
                              setShowDirectionsPopup(true);
                              setShowBottomsheet(false);
                            }}
                            className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
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
                              {place.rating && (
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
                        ))}
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
                Get Directions
              </h3>
              
              <p className="text-gray-600 mb-4">
                {isMobileDevice() 
                  ? `You're about to leave the app to get directions to ${selectedPlace.name} in your maps app.`
                  : `You're about to leave the site to get directions to ${selectedPlace.name} in Google Maps.`
                }
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
                    const lat = selectedPlace.geometry?.location?.lat();
                    const lng = selectedPlace.geometry?.location?.lng();
                    if (lat && lng) {
                      openMapsApp(lat, lng, selectedPlace.name);
                    }
                    setShowDirectionsPopup(false);
                    setSelectedPlace(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isMobileDevice() 
                    ? (isIOS() ? 'Open in Maps App' : 'Open in Google Maps')
                    : 'Open Google Maps'
                  }
                </button>
              </div>
              
              {/* Show additional info for mobile users */}
              {isMobileDevice() && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-700 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {isIOS() 
                        ? 'Will open in Google Maps app, or Apple Maps if not installed'
                        : 'Will open in Google Maps app'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <Navigation />
    </div>
  );
}
