"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocationData, detectUserLocation, saveLocationToStorage, getLocationFromStorage } from '../utils/locationUtils';

interface LocationContextType {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  hasLocation: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load location from storage on mount
  useEffect(() => {
    const storedLocation = getLocationFromStorage();
    if (storedLocation) {
      setLocation(storedLocation);
    }
  }, []);

  const refreshLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newLocation = await detectUserLocation();
      setLocation(newLocation);
      saveLocationToStorage(newLocation);
      
      if (newLocation.source === 'fallback') {
        setError('Location denied — defaulting to NYC');
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    refreshLocation,
    hasLocation: location !== null
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
