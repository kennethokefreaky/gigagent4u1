"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import Script from "next/script";

// Declare global google type
declare global {
  interface Window {
    google: typeof google;
  }
}

function LocationReviewContent() {
  const params = useSearchParams();
  const router = useRouter();
  const city = params.get("city") || "Unknown City";
  const state = params.get("state") || "";
  const latParam = params.get("lat");
  const lngParam = params.get("lng");
  
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Get coordinates from URL params or localStorage
  const getCoordinates = () => {
    if (latParam && lngParam) {
      return { lat: parseFloat(latParam), lng: parseFloat(lngParam) };
    }
    
    // Try localStorage
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

  // Convert full state name to abbreviation
  const getStateAbbreviation = (fullStateName: string): string => {
    const stateMap: { [key: string]: string } = {
      "Alabama": "AL",
      "Alaska": "AK",
      "Arizona": "AZ",
      "Arkansas": "AR",
      "California": "CA",
      "Colorado": "CO",
      "Connecticut": "CT",
      "Delaware": "DE",
      "Florida": "FL",
      "Georgia": "GA",
      "Hawaii": "HI",
      "Idaho": "ID",
      "Illinois": "IL",
      "Indiana": "IN",
      "Iowa": "IA",
      "Kansas": "KS",
      "Kentucky": "KY",
      "Louisiana": "LA",
      "Maine": "ME",
      "Maryland": "MD",
      "Massachusetts": "MA",
      "Michigan": "MI",
      "Minnesota": "MN",
      "Mississippi": "MS",
      "Missouri": "MO",
      "Montana": "MT",
      "Nebraska": "NE",
      "Nevada": "NV",
      "New Hampshire": "NH",
      "New Jersey": "NJ",
      "New Mexico": "NM",
      "New York": "NY",
      "North Carolina": "NC",
      "North Dakota": "ND",
      "Ohio": "OH",
      "Oklahoma": "OK",
      "Oregon": "OR",
      "Pennsylvania": "PA",
      "Rhode Island": "RI",
      "South Carolina": "SC",
      "South Dakota": "SD",
      "Tennessee": "TN",
      "Texas": "TX",
      "Utah": "UT",
      "Vermont": "VT",
      "Virginia": "VA",
      "Washington": "WA",
      "West Virginia": "WV",
      "Wisconsin": "WI",
      "Wyoming": "WY",
      "District of Columbia": "DC"
    };
    
    return stateMap[fullStateName] || fullStateName;
  };

  const stateAbbreviation = state ? getStateAbbreviation(state) : "";

  // Initialize Google Maps when script loads
  useEffect(() => {
    if (isGoogleMapsLoaded && mapRef.current && window.google) {
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

        // Add marker for the location
        new window.google.maps.Marker({
          position: coordinates,
          map: mapInstance,
          title: `${city}, ${stateAbbreviation}`,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#FF2C2C"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24),
          }
        });

        setMap(mapInstance);
        setMapError(null);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map');
      }
    }
  }, [isGoogleMapsLoaded, city, stateAbbreviation]);

  return (
    <div className="flex min-h-screen bg-background text-text-primary flex-col">
      {/* Google Maps Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsGoogleMapsLoaded(true)}
      />

      {/* Header */}
      <div className="px-6 py-8 text-center">
        <h1 className="text-heading font-bold mb-6">
          Nice, {city}{stateAbbreviation ? `, ${stateAbbreviation}` : ""} is great.
        </h1>

        {/* Map Container */}
        <div className="w-full h-64 mb-8 rounded-xl overflow-hidden">
          {!isGoogleMapsLoaded ? (
            <div className="w-full h-full flex items-center justify-center bg-surface">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading map...</p>
              </div>
            </div>
          ) : mapError ? (
            <div className="w-full h-full flex items-center justify-center bg-surface">
              <div className="text-center">
                <div className="text-button-red text-4xl mb-4">⚠️</div>
                <p className="text-text-primary font-medium mb-2">Map Error</p>
                <p className="text-text-secondary">{mapError}</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          )}
        </div>

        <button
          onClick={() => router.push("/gigagent4u")}
          className="w-full bg-button-red text-white py-4 radius-md font-semibold hover:bg-button-red-hover transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default function LocationReview() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <LocationReviewContent />
    </Suspense>
  );
}
