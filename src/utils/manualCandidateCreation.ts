// Manual candidate creation function to test the flow
import { supabase } from '@/lib/supabaseClient';

export const createCandidateManually = async (
  talentId: string,
  promoterId: string,
  eventId: string,
  eventTitle: string,
  offerAmount: string
) => {
  try {
    console.log('🔍 MANUAL: Creating candidate manually with data:', {
      talentId,
      promoterId,
      eventId,
      eventTitle,
      offerAmount
    });

    // Get talent profile first
    const { data: talentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, talent_categories, location, profile_image_url')
      .eq('id', talentId)
      .single();

    if (profileError) {
      console.error('❌ MANUAL: Error fetching talent profile:', profileError);
      return null;
    }

    console.log('✅ MANUAL: Talent profile found:', talentProfile);

    // Create candidate with all required fields
    const candidateData = {
      talent_id: talentId,
      promoter_id: promoterId,
      event_id: eventId,
      event_title: eventTitle,
      offer_amount: offerAmount,
      status: 'accepted' as const,
      talent_name: talentProfile.full_name || talentProfile.email || 'Unknown Talent',
      talent_categories: talentProfile.talent_categories || ['Boxer'],
      talent_location: talentProfile.location || 'Unknown Location',
      talent_image_url: talentProfile.profile_image_url || null
    };

    console.log('🔍 MANUAL: Inserting candidate data:', candidateData);

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select()
      .single();

    if (error) {
      console.error('❌ MANUAL: Error creating candidate:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('✅ MANUAL: Candidate created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ MANUAL: Exception in createCandidateManually:', error);
    return null;
  }
};
