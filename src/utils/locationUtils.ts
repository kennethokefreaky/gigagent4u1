export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'google' | 'html5' | 'fallback';
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

// NYC coordinates as fallback
export const NYC_COORDINATES = {
  latitude: 40.7128,
  longitude: -74.0060,
  source: 'fallback' as const
};

// Google Geolocation API endpoint
const GOOGLE_GEOLOCATION_URL = 'https://www.googleapis.com/geolocation/v1/geolocate';

/**
 * Primary: Google Maps Geolocation API
 * Uses Google's Geolocation API with network and sensor data
 */
export const getLocationFromGoogle = async (): Promise<LocationData | null> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found');
    }

    // Get network information
    const networkData = await getNetworkData();
    
    const response = await fetch(`${GOOGLE_GEOLOCATION_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        considerIp: true,
        ...networkData
      })
    });

    if (!response.ok) {
      throw new Error(`Google Geolocation API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.location) {
      return {
        latitude: data.location.lat,
        longitude: data.location.lng,
        accuracy: data.accuracy,
        source: 'google',
        timestamp: Date.now()
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Google Geolocation API failed:', error);
    return null;
  }
};

/**
 * Secondary: HTML5 Geolocation API
 * Browser's built-in geolocation with high accuracy
 */
export const getLocationFromHTML5 = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
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
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'html5',
          timestamp: Date.now()
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: getGeolocationErrorMessage(error.code)
        });
      },
      options
    );
  });
};

/**
 * Tertiary: Fallback to NYC
 * Returns NYC coordinates when all else fails
 */
export const getFallbackLocation = (): LocationData => {
  return {
    ...NYC_COORDINATES,
    accuracy: 0,
    timestamp: Date.now()
  };
};

/**
 * Main location detection function with fallback chain
 * 1. Google Geolocation API
 * 2. HTML5 Geolocation API  
 * 3. Fallback to NYC
 */
export const detectUserLocation = async (): Promise<LocationData> => {
  try {
    // Primary: Try Google Geolocation API
    const googleLocation = await getLocationFromGoogle();
    if (googleLocation) {
      console.log('Location detected via Google Geolocation API');
      return googleLocation;
    }
  } catch (error) {
    console.warn('Google Geolocation API failed:', error);
  }

  try {
    // Secondary: Try HTML5 Geolocation API
    const html5Location = await getLocationFromHTML5();
    console.log('Location detected via HTML5 Geolocation API');
    return html5Location;
  } catch (error) {
    console.warn('HTML5 Geolocation API failed:', error);
  }

  // Tertiary: Fallback to NYC
  console.log('Using fallback location: NYC');
  return getFallbackLocation();
};

/**
 * Get network data for Google Geolocation API
 */
const getNetworkData = async () => {
  const networkData: any = {};

  try {
    // Get WiFi networks (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.type) {
        networkData.radioType = connection.type;
      }
    }

    return networkData;
  } catch (error) {
    console.warn('Could not gather network data:', error);
    return networkData;
  }
};

/**
 * Get user-friendly error message for geolocation errors
 */
const getGeolocationErrorMessage = (code: number): string => {
  switch (code) {
    case 1:
      return 'Location access denied by user';
    case 2:
      return 'Location information unavailable';
    case 3:
      return 'Location request timed out';
    default:
      return 'Unknown location error';
  }
};

/**
 * Save location to sessionStorage
 */
export const saveLocationToStorage = (location: LocationData): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('userLocation', JSON.stringify(location));
  }
};

/**
 * Get location from sessionStorage
 */
export const getLocationFromStorage = (): LocationData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem('userLocation');
    if (stored) {
      const location = JSON.parse(stored) as LocationData;
      // Check if location is still fresh (less than 1 hour old)
      const isFresh = Date.now() - location.timestamp < 3600000; // 1 hour
      return isFresh ? location : null;
    }
  } catch (error) {
    console.error('Error parsing stored location:', error);
  }
  
  return null;
};

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
