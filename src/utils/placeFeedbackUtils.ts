import { supabase } from '@/lib/supabaseClient';

export interface PlaceFeedback {
  id: string;
  place_id: string;
  place_name: string;
  place_address?: string;
  place_latitude?: number;
  place_longitude?: number;
  user_id: string;
  user_name?: string;
  user_role?: string;
  rating?: number;
  comment?: string;
  feedback_type: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaceRating {
  id: string;
  place_id: string;
  place_name: string;
  place_address?: string;
  place_latitude?: number;
  place_longitude?: number;
  total_ratings: number;
  average_rating: number;
  total_comments: number;
  last_updated: string;
  created_at: string;
}

export interface FeedbackFormData {
  place_id: string;
  place_name: string;
  place_address?: string;
  place_latitude?: number;
  place_longitude?: number;
  rating?: number;
  comment?: string;
  feedback_type?: string;
}

/**
 * Get place ratings and feedback count
 */
export const getPlaceRating = async (placeId: string): Promise<PlaceRating | null> => {
  try {
    console.log('Getting place rating for:', placeId);

    const { data, error } = await supabase
      .from('place_ratings')
      .select('*')
      .eq('place_id', placeId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting place rating:', error);
      return null;
    }

    if (data) {
      console.log('Found place rating:', data);
    } else {
      console.log('No rating found for place, returning default');
      return {
        id: '',
        place_id: placeId,
        place_name: '',
        total_ratings: 0,
        average_rating: 0,
        total_comments: 0,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    }

    return data;
  } catch (error) {
    console.error('Exception in getPlaceRating:', error);
    return null;
  }
};

/**
 * Get all feedback for a place
 */
export const getPlaceFeedback = async (placeId: string): Promise<PlaceFeedback[]> => {
  try {
    console.log('Getting place feedback for:', placeId);

    const { data, error } = await supabase
      .from('place_feedback')
      .select('*')
      .eq('place_id', placeId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(' Error getting place feedback:', error);
      return [];
    }

    console.log(' Found place feedback:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error(' Exception in getPlaceFeedback:', error);
    return [];
  }
};

/**
 * Add feedback for a place
 */
export const addPlaceFeedback = async (
  userId: string,
  feedbackData: FeedbackFormData
): Promise<PlaceFeedback | null> => {
  try {
    console.log(' Adding place feedback:', { userId, feedbackData });

    // Get user profile for name and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(' Error getting user profile:', profileError);
    }

    const { data, error } = await supabase
      .from('place_feedback')
      .insert({
        place_id: feedbackData.place_id,
        place_name: feedbackData.place_name,
        place_address: feedbackData.place_address,
        place_latitude: feedbackData.place_latitude,
        place_longitude: feedbackData.place_longitude,
        user_id: userId,
        user_name: profile?.full_name || 'Anonymous',
        user_role: profile?.role || 'user',
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        feedback_type: feedbackData.feedback_type || 'review',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(' Error adding place feedback:', error);
      return null;
    }

    console.log(' Place feedback added successfully:', data);
    return data;
  } catch (error) {
    console.error(' Exception in addPlaceFeedback:', error);
    return null;
  }
};

/**
 * Update existing feedback
 */
export const updatePlaceFeedback = async (
  feedbackId: string,
  userId: string,
  feedbackData: Partial<FeedbackFormData>
): Promise<PlaceFeedback | null> => {
  try {
    console.log(' Updating place feedback:', { feedbackId, userId, feedbackData });

    const { data, error } = await supabase
      .from('place_feedback')
      .update({
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(' Error updating place feedback:', error);
      return null;
    }

    console.log(' Place feedback updated successfully:', data);
    return data;
  } catch (error) {
    console.error(' Exception in updatePlaceFeedback:', error);
    return null;
  }
};

/**
 * Delete feedback
 */
export const deletePlaceFeedback = async (
  feedbackId: string,
  userId: string
): Promise<boolean> => {
  try {
    console.log(' Deleting place feedback:', { feedbackId, userId });

    const { error } = await supabase
      .from('place_feedback')
      .delete()
      .eq('id', feedbackId)
      .eq('user_id', userId);

    if (error) {
      console.error(' Error deleting place feedback:', error);
      return false;
    }

    console.log(' Place feedback deleted successfully');
    return true;
  } catch (error) {
    console.error(' Exception in deletePlaceFeedback:', error);
    return false;
  }
};

/**
 * Get user's feedback for a place (all comments, not just one)
 */
export const getUserPlaceFeedback = async (
  placeId: string,
  userId: string
): Promise<PlaceFeedback[]> => {
  try {
    console.log(' Getting user feedback for place:', { placeId, userId });

    const { data, error } = await supabase
      .from('place_feedback')
      .select('*')
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(' Error getting user place feedback:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(' Exception in getUserPlaceFeedback:', error);
    return [];
  }
};

/**
 * Get user's latest feedback for a place (for editing)
 */
export const getUserLatestPlaceFeedback = async (
  placeId: string,
  userId: string
): Promise<PlaceFeedback | null> => {
  try {
    console.log(' Getting user latest feedback for place:', { placeId, userId });

    const { data, error } = await supabase
      .from('place_feedback')
      .select('*')
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(' Error getting user latest place feedback:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(' Exception in getUserLatestPlaceFeedback:', error);
    return null;
  }
};

/**
 * Generate unique place ID from Google Places data
 */
export const generatePlaceId = (place: any): string => {
  if (place.place_id) {
    return place.place_id;
  }
  
  // Fallback: create ID from coordinates and name
  const lat = place.geometry?.location?.lat() || 0;
  const lng = place.geometry?.location?.lng() || 0;
  const name = place.name || 'Unknown Place';
  
  return `${name.replace(/\s+/g, '_')}_${lat.toFixed(6)}_${lng.toFixed(6)}`;
};
