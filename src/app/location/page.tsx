"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { saveUserLocation, parseLocationData } from "../../utils/locationStorageUtils";

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'google' | 'html5' | 'ip' | 'fallback';
  city?: string;
  state?: string;
}

function LocationPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") || "Talent";
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Detect if device is mobile/tablet
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Save location to Supabase
  const saveLocationToStorage = async (locationData: LocationData) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user - cannot save location');
        return;
      }

        // Parse location data for Supabase
        const locationName = locationData.city && locationData.state 
          ? `${locationData.city}, ${locationData.state}`
          : 'Current Location';
        
        const address = locationData.city && locationData.state 
          ? `${locationData.city}, ${locationData.state}`
          : undefined;

        const parsedLocationData = parseLocationData(
          locationName,
          address,
          { lat: locationData.lat, lng: locationData.lng }
        );

        // Save to Supabase
        const savedLocation = await saveUserLocation(user.id, parsedLocationData);
        
        if (savedLocation) {
          console.log('✅ Location saved to Supabase successfully');
        } else {
          console.log('⚠️ Failed to save location to Supabase');
        }
      } catch (error) {
        console.error('❌ Error saving location to Supabase:', error);
      }
    };

  // Google Geocoding API to get city/state from lat/lng
  const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string; state: string }> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Google Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        let city = '';
        let state = '';
        
        // Extract city and state from address components
        for (const component of result.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
        }
        
        // Fallback to country if state not found
        if (!state) {
          for (const component of result.address_components) {
            if (component.types.includes('country')) {
              state = component.short_name;
              break;
            }
          }
        }
        
        return { 
          city: city || 'Unknown City', 
          state: state || 'Unknown State' 
        };
      }
      
      throw new Error('No geocoding results found');
    } catch (error) {
      console.error('Google Geocoding failed:', error);
      // Fallback to Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&countrycodes=us`,
          { headers: { "User-Agent": "GA4U-App" } }
        );
        const data = await res.json();
        
        const city = data.address?.city || data.address?.town || data.address?.village || "Unknown City";
        const state = data.address?.state || "Unknown State";
        
        return { city, state };
      } catch (nominatimError) {
        console.error('Nominatim fallback failed:', nominatimError);
        return { city: 'Unknown City', state: 'Unknown State' };
      }
    }
  };

  // Step 1: Google Geolocation API (preferred)
  const getGoogleGeolocation = async (): Promise<LocationData | null> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const geolocationUrl = process.env.NEXT_PUBLIC_GOOGLE_GEOLOCATION_URL;
      
      if (!apiKey || !geolocationUrl) {
        throw new Error('Google Maps API key not configured');
      }

      const response = await fetch(`${geolocationUrl}${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          considerIp: true
        })
      });

      if (!response.ok) {
        throw new Error(`Google Geolocation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.location) {
        return {
          lat: data.location.lat,
          lng: data.location.lng,
          accuracy: data.accuracy,
          source: 'google'
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Google Geolocation API failed:', error);
      return null;
    }
  };

  // Step 2: HTML5 Geolocation (secondary)
  const getHTML5Geolocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'html5'
          });
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  };

  // Step 3: IP-based Geolocation (fallback)
  const getIPGeolocation = async (): Promise<LocationData> => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error(`IP Geolocation API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lng: data.longitude,
          source: 'ip'
        };
      }
      
      throw new Error('Invalid IP geolocation data');
    } catch (error) {
      console.warn('IP Geolocation failed:', error);
      throw error;
    }
  };

  // Step 4: Hard fallback to NYC
  const getNYCFallback = (): LocationData => {
    return {
      lat: 40.7128,
      lng: -74.0060,
      source: 'fallback'
    };
  };

  // Device-specific fallback chain
  const detectLocation = async (): Promise<LocationData> => {
    const isMobile = isMobileDevice();
    console.log(`Detecting location for ${isMobile ? 'mobile/tablet' : 'desktop'} device`);
    
    // Step 1: Try Google Geolocation API (always first)
    try {
      const googleLocation = await getGoogleGeolocation();
      if (googleLocation) {
        console.log('Location detected via Google Geolocation API');
        return googleLocation;
      }
    } catch (error) {
      console.warn('Google Geolocation API failed:', error);
    }

    if (isMobile) {
      // Mobile/Tablet: Google → HTML5 → IP → NYC
      try {
        const html5Location = await getHTML5Geolocation();
        console.log('Location detected via HTML5 Geolocation');
        return html5Location;
      } catch (error) {
        console.warn('HTML5 Geolocation failed:', error);
      }

      try {
        const ipLocation = await getIPGeolocation();
        console.log('Location detected via IP Geolocation');
        return ipLocation;
      } catch (error) {
        console.warn('IP Geolocation failed:', error);
      }
    } else {
      // Desktop: Google → IP → HTML5 → NYC
      try {
        const ipLocation = await getIPGeolocation();
        console.log('Location detected via IP Geolocation');
        return ipLocation;
      } catch (error) {
        console.warn('IP Geolocation failed:', error);
      }

      try {
        const html5Location = await getHTML5Geolocation();
        console.log('Location detected via HTML5 Geolocation');
        return html5Location;
      } catch (error) {
        console.warn('HTML5 Geolocation failed:', error);
      }
    }

    // Final fallback to NYC
    console.log('Using NYC fallback location');
    return getNYCFallback();
  };

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const detectedLocation = await detectLocation();
      setLocation(detectedLocation);
      
      // Show toast for fallback locations
      if (detectedLocation.source === 'fallback') {
        setError('Location denied — defaulting to NYC');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }

      // Reverse geocode using Google Geocoding API
      const { city, state } = await reverseGeocode(detectedLocation.lat, detectedLocation.lng);
      
      // Update location with city/state
      const fullLocationData = {
        ...detectedLocation,
        city,
        state
      };
      
      // Save complete location data to Supabase
      await saveLocationToStorage(fullLocationData);
      
      // Navigate to review page with all data
      router.push(`/locationreview?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&lat=${detectedLocation.lat}&lng=${detectedLocation.lng}`);
      
    } catch (error) {
      console.error("Error detecting location:", error);
      setError('Failed to detect location');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset loading state on component mount
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Show toast when location is denied
  useEffect(() => {
    if (error && error.includes('denied')) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen bg-background text-text-primary items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-heading font-bold mb-6">
          {role === "Promoter" ? "Where are we creating a gig?" : "Where are we finding gigs?"}
        </h1>

        <div className="w-full h-64 mb-8 flex items-center justify-center">
          <img 
            src="/locations.png" 
            alt="Location selection" 
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <button
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="w-full bg-button-red text-white py-4 radius-md font-semibold mb-4 hover:bg-button-red-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? "Detecting location..." : "Current location"}
        </button>

        {/* Toast for location denied */}
        {showToast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-surface border border-text-secondary rounded-lg px-4 py-2 text-text-primary text-sm shadow-lg z-50">
            Location denied — defaulting to NYC
          </div>
        )}

        <button
          onClick={() => router.push("/locationsearch")}
          className="w-full border border-button-red text-button-red py-4 radius-md font-semibold hover:bg-button-red hover:text-white transition-colors"
        >
          Somewhere else
        </button>
      </div>
    </div>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <LocationPageContent />
    </Suspense>
  );
}
