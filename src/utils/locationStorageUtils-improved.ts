import { supabase } from '@/lib/supabaseClient';

export interface UserLocation {
  id: string;
  user_id: string;
  location_name: string;
  address?: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country: string;
  is_primary: boolean;
  location_type: string;
  distance_miles?: number;
  created_at: string;
  updated_at: string;
}

export interface LocationData {
  location_name: string;
  address?: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  location_type?: string;
}

/**
 * Save user's location to database using improved approach
 */
export const saveUserLocation = async (
  userId: string,
  locationData: LocationData
): Promise<UserLocation | null> => {
  try {
    console.log('🔍 Saving user location (improved):', { userId, locationData });

    // Use the database function for more robust saving
    const { data, error } = await supabase
      .rpc('save_user_location', {
        p_user_id: userId,
        p_location_name: locationData.location_name,
        p_address: locationData.address || null,
        p_latitude: locationData.latitude,
        p_longitude: locationData.longitude,
        p_city: locationData.city || null,
        p_state: locationData.state || null,
        p_country: locationData.country || 'Unknown',
        p_location_type: locationData.location_type || 'user_selected'
      });

    if (error) {
      console.error('❌ Error saving user location (improved):', error);
      
      // Fallback to direct insert if function doesn't exist
      console.log('🔄 Falling back to direct insert...');
      return await saveUserLocationFallback(userId, locationData);
    }

    if (data && data.length > 0) {
      console.log('✅ User location saved successfully (improved):', data[0]);
      return data[0];
    } else {
      console.error('❌ No data returned from save_user_location function');
      return null;
    }
  } catch (error) {
    console.error('❌ Exception in saveUserLocation (improved):', error);
    
    // Fallback to direct insert
    console.log('🔄 Falling back to direct insert...');
    return await saveUserLocationFallback(userId, locationData);
  }
};

/**
 * Fallback method for saving user location (original approach)
 */
const saveUserLocationFallback = async (
  userId: string,
  locationData: LocationData
): Promise<UserLocation | null> => {
  try {
    console.log('🔍 Saving user location (fallback):', { userId, locationData });

    // First, set all existing locations as non-primary
    const { error: updateError } = await supabase
      .from('user_locations')
      .update({ is_primary: false })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating existing locations (fallback):', updateError);
      // Continue anyway - this might not be critical
    }

    // Insert new primary location
    const { data, error } = await supabase
      .from('user_locations')
      .insert({
        user_id: userId,
        location_name: locationData.location_name,
        address: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country || 'Unknown',
        is_primary: true,
        location_type: locationData.location_type || 'user_selected',
        distance_miles: 10, // Default distance
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving user location (fallback):', error);
      return null;
    }

    console.log('✅ User location saved successfully (fallback):', data);
    return data;
  } catch (error) {
    console.error('❌ Exception in saveUserLocationFallback:', error);
    return null;
  }
};

/**
 * Get user's primary location
 */
export const getUserPrimaryLocation = async (userId: string): Promise<UserLocation | null> => {
  try {
    console.log('🔍 Getting user primary location:', userId);

    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error getting user primary location:', error);
      return null;
    }

    if (data) {
      console.log('✅ Found user primary location:', data);
    } else {
      console.log('ℹ️ No primary location found for user');
    }

    return data;
  } catch (error) {
    console.error('❌ Exception in getUserPrimaryLocation:', error);
    return null;
  }
};

/**
 * Get all user locations
 */
export const getUserLocations = async (userId: string): Promise<UserLocation[]> => {
  try {
    console.log('🔍 Getting all user locations:', userId);

    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting user locations:', error);
      return [];
    }

    console.log('✅ Found user locations:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Exception in getUserLocations:', error);
    return [];
  }
};

/**
 * Update user's primary location
 */
export const updateUserPrimaryLocation = async (
  userId: string,
  locationId: string
): Promise<boolean> => {
  try {
    console.log('🔍 Updating user primary location:', { userId, locationId });

    // First, set all locations as non-primary
    const { error: updateError } = await supabase
      .from('user_locations')
      .update({ is_primary: false })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating existing locations:', updateError);
      return false;
    }

    // Set the selected location as primary
    const { error: setPrimaryError } = await supabase
      .from('user_locations')
      .update({ is_primary: true })
      .eq('id', locationId)
      .eq('user_id', userId);

    if (setPrimaryError) {
      console.error('❌ Error setting primary location:', setPrimaryError);
      return false;
    }

    console.log('✅ User primary location updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception in updateUserPrimaryLocation:', error);
    return false;
  }
};

/**
 * Delete user location
 */
export const deleteUserLocation = async (
  userId: string,
  locationId: string
): Promise<boolean> => {
  try {
    console.log('🔍 Deleting user location:', { userId, locationId });

    const { error } = await supabase
      .from('user_locations')
      .delete()
      .eq('id', locationId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deleting user location:', error);
      return false;
    }

    console.log('✅ User location deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception in deleteUserLocation:', error);
    return false;
  }
};

/**
 * Parse location data from various sources (Google Places, manual input, etc.)
 */
export const parseLocationData = (
  locationName: string,
  address?: string,
  coordinates?: { lat: number; lng: number },
  placeDetails?: any
): LocationData => {
  const locationData: LocationData = {
    location_name: locationName,
    address: address,
    latitude: coordinates?.lat || 0,
    longitude: coordinates?.lng || 0,
    country: 'Unknown'
  };

  // Parse city and state from address or place details
  if (address) {
    const addressParts = address.split(',');
    if (addressParts.length >= 2) {
      locationData.city = addressParts[0]?.trim();
      locationData.state = addressParts[1]?.trim();
    }
  }

  // Use place details if available
  if (placeDetails) {
    if (placeDetails.address_components) {
      placeDetails.address_components.forEach((component: any) => {
        if (component.types.includes('locality')) {
          locationData.city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          locationData.state = component.short_name;
        }
        if (component.types.includes('country')) {
          locationData.country = component.short_name;
        }
      });
    }
  }

  return locationData;
};

/**
 * Get user's distance preference from their primary location
 */
export const getUserDistancePreference = async (userId: string): Promise<number> => {
  try {
    console.log('🔍 Getting user distance preference:', userId);

    const { data, error } = await supabase
      .from('user_locations')
      .select('distance_miles')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error getting user distance preference:', error);
      return 10; // Default to 10 miles
    }

    if (data && data.distance_miles !== null) {
      console.log('✅ Found user distance preference:', data.distance_miles);
      return data.distance_miles;
    } else {
      console.log('ℹ️ No distance preference found, using default 10 miles');
      return 10; // Default to 10 miles
    }
  } catch (error) {
    console.error('❌ Exception in getUserDistancePreference:', error);
    return 10; // Default to 10 miles
  }
};

/**
 * Update user's distance preference in their primary location
 */
export const updateUserDistancePreference = async (
  userId: string,
  distanceMiles: number
): Promise<boolean> => {
  try {
    console.log('🔍 Updating user distance preference:', { userId, distanceMiles });

    // Validate distance range
    if (distanceMiles < 0 || distanceMiles > 100) {
      console.error('❌ Invalid distance range:', distanceMiles);
      return false;
    }

    const { error } = await supabase
      .from('user_locations')
      .update({ 
        distance_miles: distanceMiles,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_primary', true);

    if (error) {
      console.error('❌ Error updating user distance preference:', error);
      return false;
    }

    console.log('✅ User distance preference updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception in updateUserDistancePreference:', error);
    return false;
  }
};
