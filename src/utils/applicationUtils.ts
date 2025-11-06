import { supabase } from '@/lib/supabaseClient';
import { addTalentToGroupChat } from './groupChatInitUtils';

export interface Application {
  id: string;
  event_id: string;
  talent_id: string;
  promoter_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  created_at: string;
  updated_at: string;
}

/**
 * Create a new application when talent applies to an event
 */
export const createApplication = async (
  talentId: string,
  promoterId: string,
  eventId: string
): Promise<Application | null> => {
  try {
    // Create application record
    const { data, error } = await supabase
      .from('applications')
      .insert({
        talent_id: talentId,
        promoter_id: promoterId,
        event_id: eventId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return null;
    }

    // Add talent to group chat when they apply
    try {
      console.log('🔍 Adding talent to group chat after application:', { eventId, talentId });
      const groupChatResult = await addTalentToGroupChat(eventId, talentId);
      console.log('🔍 Group chat result:', groupChatResult);
    } catch (groupChatError) {
      console.error('❌ Error adding talent to group chat:', groupChatError);
      // Don't fail the application if group chat addition fails
    }

    return data;
  } catch (error) {
    console.error('Error creating application:', error);
    return null;
  }
};

/**
 * Get applications by promoter
 */
export const getApplicationsByPromoter = async (promoterId: string): Promise<Application[]> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('promoter_id', promoterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
};

/**
 * Get applications by talent
 */
export const getApplicationsByTalent = async (talentId: string): Promise<Application[]> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('talent_id', talentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications by talent:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching applications by talent:', error);
    return [];
  }
};

/**
 * Check if talent has already applied to an event
 */
export const hasTalentApplied = async (talentId: string, eventId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('talent_id', talentId)
      .eq('event_id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking application:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking application:', error);
    return false;
  }
};

/**
 * Get applications with event details for promoter view
 */
export const getApplicationsWithEventDetails = async (promoterId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        posts!inner(title, promoter_id),
        profiles!applications_talent_id_fkey(full_name, talent_categories, location, profile_image_url)
      `)
      .eq('promoter_id', promoterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications with details:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching applications with details:', error);
    return [];
  }
};
