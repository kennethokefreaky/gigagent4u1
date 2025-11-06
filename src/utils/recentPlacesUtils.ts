import { supabase } from '@/lib/supabaseClient';

export interface RecentPlace {
  id: string;
  place_id: string;
  place_name: string;
  place_address?: string;
  place_vicinity?: string;
  latitude?: number;
  longitude?: number;
  place_type: 'searched' | 'selected' | 'reviewed';
  last_interaction: string;
}

export interface PlaceData {
  place_id: string;
  name: string;
  address?: string;
  vicinity?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat(): number;
      lng(): number;
    };
  };
}

/**
 * Add or update a recent place for the current user
 */
export const addRecentPlace = async (
  placeData: PlaceData,
  placeType: 'searched' | 'selected' | 'reviewed' = 'searched'
): Promise<RecentPlace | null> => {
  try {
    console.log('📍 Adding recent place:', { placeData, placeType });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ No authenticated user:', authError);
      return null;
    }
    
    console.log('👤 User authenticated:', user.id);

    const latitude = typeof placeData.geometry?.location?.lat === 'function' 
      ? placeData.geometry.location.lat() 
      : placeData.geometry?.location?.lat;
    const longitude = typeof placeData.geometry?.location?.lng === 'function' 
      ? placeData.geometry.location.lng() 
      : placeData.geometry?.location?.lng;

    const { data, error } = await supabase.rpc('add_recent_place', {
      p_user_id: user.id,
      p_place_id: placeData.place_id,
      p_place_name: placeData.name,
      p_place_address: placeData.address || placeData.formatted_address,
      p_place_vicinity: placeData.vicinity,
      p_latitude: latitude,
      p_longitude: longitude,
      p_place_type: placeType
    });

    if (error) {
      console.error('❌ Error adding recent place:', error);
      return null;
    }

    console.log('✅ Recent place added successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in addRecentPlace:', error);
    return null;
  }
};

/**
 * Get recent places for the current user
 */
export const getRecentPlaces = async (limit: number = 20): Promise<RecentPlace[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('No authenticated user:', authError);
      return [];
    }

    const { data, error } = await supabase.rpc('get_recent_places', {
      p_user_id: user.id,
      p_limit: limit
    });

    if (error) {
      console.error('Error getting recent places:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getRecentPlaces:', error);
    return [];
  }
};

/**
 * Convert RecentPlace to PlaceData format for compatibility
 */
export const recentPlaceToPlaceData = (recentPlace: RecentPlace): PlaceData => {
  return {
    place_id: recentPlace.place_id,
    name: recentPlace.place_name,
    address: recentPlace.place_address,
    vicinity: recentPlace.place_vicinity,
    formatted_address: recentPlace.place_address,
    geometry: recentPlace.latitude && recentPlace.longitude ? {
      location: {
        lat: () => recentPlace.latitude!,
        lng: () => recentPlace.longitude!
      }
    } : undefined
  };
};

/**
 * Mark a place as reviewed (called when user submits feedback)
 */
export const markPlaceAsReviewed = async (placeData: PlaceData): Promise<boolean> => {
  try {
    const result = await addRecentPlace(placeData, 'reviewed');
    return result !== null;
  } catch (error) {
    console.error('Exception in markPlaceAsReviewed:', error);
    return false;
  }
};

/**
 * Mark a place as selected (called when user selects a place from search)
 */
export const markPlaceAsSelected = async (placeData: PlaceData): Promise<boolean> => {
  try {
    console.log('🎯 Marking place as selected:', placeData);
    const result = await addRecentPlace(placeData, 'selected');
    console.log('✅ Place marked as selected successfully:', result);
    return result !== null;
  } catch (error) {
    console.error('❌ Exception in markPlaceAsSelected:', error);
    return false;
  }
};

/**
 * Enhanced function to add recent place with automatic cleanup
 */
export const addRecentPlaceEnhanced = async (
  placeData: PlaceData,
  placeType: 'searched' | 'selected' | 'reviewed' = 'searched',
  maxPlaces: number = 50
): Promise<RecentPlace | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('No authenticated user:', authError);
      return null;
    }

    const latitude = typeof placeData.geometry?.location?.lat === 'function' 
      ? placeData.geometry.location.lat() 
      : placeData.geometry?.location?.lat;
    const longitude = typeof placeData.geometry?.location?.lng === 'function' 
      ? placeData.geometry.location.lng() 
      : placeData.geometry?.location?.lng;

    const { data, error } = await supabase.rpc('add_recent_place_enhanced', {
      p_user_id: user.id,
      p_place_id: placeData.place_id,
      p_place_name: placeData.name,
      p_place_address: placeData.address || placeData.formatted_address,
      p_place_vicinity: placeData.vicinity,
      p_latitude: latitude,
      p_longitude: longitude,
      p_place_type: placeType,
      p_max_places: maxPlaces
    });

    if (error) {
      console.error('Error adding recent place (enhanced):', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in addRecentPlaceEnhanced:', error);
    return null;
  }
};

/**
 * Get recent places with filtering options
 */
export const getRecentPlacesFiltered = async (
  limit: number = 20,
  placeTypeFilter?: 'searched' | 'selected' | 'reviewed',
  daysBack?: number
): Promise<RecentPlace[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('No authenticated user:', authError);
      return [];
    }

    const { data, error } = await supabase.rpc('get_recent_places_filtered', {
      p_user_id: user.id,
      p_limit: limit,
      p_place_type_filter: placeTypeFilter,
      p_days_back: daysBack
    });

    if (error) {
      console.error('Error getting filtered recent places:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getRecentPlacesFiltered:', error);
    return [];
  }
};

/**
 * Get recent places statistics for the current user
 */
export const getRecentPlacesStats = async (): Promise<{
  total_places: number;
  searched_count: number;
  selected_count: number;
  reviewed_count: number;
  most_recent_interaction: string | null;
  oldest_interaction: string | null;
} | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('No authenticated user:', authError);
      return null;
    }

    const { data, error } = await supabase.rpc('get_recent_places_stats', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error getting recent places stats:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in getRecentPlacesStats:', error);
    return null;
  }
};

/**
 * Clean up old recent places (older than specified days)
 */
export const cleanupOldRecentPlaces = async (daysToKeep: number = 90): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('cleanup_old_recent_places', {
      p_days_to_keep: daysToKeep
    });

    if (error) {
      console.error('Error cleaning up old recent places:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Exception in cleanupOldRecentPlaces:', error);
    return 0;
  }
};
