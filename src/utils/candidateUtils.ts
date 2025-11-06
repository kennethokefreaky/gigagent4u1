import { supabase } from '@/lib/supabaseClient';

export interface Candidate {
  id: string;
  talent_id: string;
  promoter_id: string;
  event_id: string;
  event_title: string;
  offer_amount: string;
  status: 'accepted' | 'pending' | 'declined';
  talent_name: string;
  talent_categories: string[];
  talent_location?: string;
  talent_image_url?: string;
  promoter_name?: string;
  created_at: string;
  updated_at: string;
}

export const createCandidate = async (
  talentId: string,
  promoterId: string,
  eventId: string,
  eventTitle: string,
  offerAmount: string
): Promise<Candidate | null> => {
  try {
    console.log('🔍 Creating candidate with data:', {
      talentId,
      promoterId,
      eventId,
      eventTitle,
      offerAmount
    });

    // First, let's test if we can insert into candidates table at all
    console.log('🔍 Testing basic candidates table access...');
    const { data: testInsert, error: testError } = await supabase
      .from('candidates')
      .insert({
        talent_id: talentId,
        promoter_id: promoterId,
        event_id: eventId,
        event_title: eventTitle,
        offer_amount: offerAmount,
        status: 'accepted',
        talent_name: 'Test Talent',
        talent_categories: ['Boxer'],
        talent_location: 'Test Location',
        talent_image_url: 'https://example.com/image.jpg'
      })
      .select()
      .single();

    console.log('🔍 Test insert result:', { testInsert, testError });
    
    if (testError) {
      console.error('❌ Test insert failed:', testError);
      return null;
    }

    console.log('✅ Test insert successful, now getting talent profile...');

    // Get talent information
    const { data: talentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, talent_categories, location, profile_image_url')
      .eq('id', talentId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching talent profile:', profileError);
      return null;
    }

    if (!talentProfile) {
      console.error('❌ Talent profile not found for ID:', talentId);
      return null;
    }

    console.log('✅ Talent profile found:', talentProfile);

    // Create candidate record
    const candidateData = {
      talent_id: talentId,
      promoter_id: promoterId,
      event_id: eventId,
      event_title: eventTitle,
      offer_amount: offerAmount,
      status: 'accepted' as const,
      talent_name: talentProfile.full_name || talentProfile.email || 'Unknown Talent',
      talent_categories: talentProfile.talent_categories || [],
      talent_location: talentProfile.location,
      talent_image_url: talentProfile.profile_image_url
    };

    console.log('🔍 Inserting candidate data:', candidateData);

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating candidate:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('✅ Candidate created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Exception in createCandidate:', error);
    return null;
  }
};

export const getCandidatesByPromoter = async (promoterId: string): Promise<Candidate[]> => {
  try {
    console.log('🔍 Fetching candidates for promoter:', promoterId);
    
    // First, get candidates with basic data
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('promoter_id', promoterId)
      .in('status', ['accepted', 'pending'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching candidates:', error);
      return [];
    }

    if (!candidates || candidates.length === 0) {
      console.log('✅ No candidates found for promoter');
      return [];
    }

    console.log('🔍 Found candidates, enriching with profile data:', candidates.length);

    // Enrich candidates with fresh profile data to ensure names are current
    const enrichedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        console.log('🔍 Processing candidate:', candidate.id);

        // Fetch fresh profile data for talent
        const { data: talentProfile, error: talentProfileError } = await supabase
          .from('profiles')
          .select('full_name, email, talent_categories, location, profile_image_url')
          .eq('id', candidate.talent_id)
          .single();

        if (talentProfileError) {
          console.error('❌ Error fetching talent profile:', candidate.talent_id, talentProfileError);
        }

        // Fetch promoter profile data for promoter name fallback
        const { data: promoterProfile, error: promoterProfileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', candidate.promoter_id)
          .single();

        if (promoterProfileError) {
          console.error('❌ Error fetching promoter profile:', candidate.promoter_id, promoterProfileError);
        }

        // Update candidate with profile data using email fallbacks
        const updatedCandidate = {
          ...candidate,
          talent_name: talentProfile?.full_name || talentProfile?.email || candidate.talent_name || 'Unknown Talent',
          talent_categories: talentProfile?.talent_categories || candidate.talent_categories || ['Boxer'],
          talent_location: talentProfile?.location || candidate.talent_location || 'Unknown Location',
          talent_image_url: talentProfile?.profile_image_url || candidate.talent_image_url,
          // Add promoter name with email fallback
          promoter_name: promoterProfile?.full_name || promoterProfile?.email || 'Unknown Promoter'
        };

        console.log('✅ Enriched candidate:', {
          id: candidate.id,
          talent_name: updatedCandidate.talent_name,
          promoter_name: updatedCandidate.promoter_name,
          talent_email: talentProfile?.email,
          promoter_email: promoterProfile?.email
        });

        return updatedCandidate;
      })
    );

    console.log('✅ Returning enriched candidates:', enrichedCandidates.length);
    return enrichedCandidates;

  } catch (error) {
    console.error('❌ Error fetching candidates:', error);
    return [];
  }
};

export const getCandidatesByEvent = async (eventId: string): Promise<Candidate[]> => {
  try {
    console.log('🔍 Fetching candidates for event:', eventId);
    
    // First, get candidates with basic data
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('event_id', eventId)
      .in('status', ['accepted', 'pending'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching candidates by event:', error);
      return [];
    }

    if (!candidates || candidates.length === 0) {
      console.log('✅ No candidates found for event');
      return [];
    }

    console.log('🔍 Found candidates, enriching with profile data:', candidates.length);

    // Enrich candidates with fresh profile data to ensure names are current
    const enrichedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        console.log('🔍 Processing candidate:', candidate.id);

        // Fetch fresh profile data for talent
        const { data: talentProfile, error: talentProfileError } = await supabase
          .from('profiles')
          .select('full_name, email, talent_categories, location, profile_image_url')
          .eq('id', candidate.talent_id)
          .single();

        if (talentProfileError) {
          console.error('❌ Error fetching talent profile:', candidate.talent_id, talentProfileError);
        }

        // Fetch promoter profile data for promoter name fallback
        const { data: promoterProfile, error: promoterProfileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', candidate.promoter_id)
          .single();

        if (promoterProfileError) {
          console.error('❌ Error fetching promoter profile:', candidate.promoter_id, promoterProfileError);
        }

        // Update candidate with profile data using email fallbacks
        const updatedCandidate = {
          ...candidate,
          talent_name: talentProfile?.full_name || talentProfile?.email || candidate.talent_name || 'Unknown Talent',
          talent_categories: talentProfile?.talent_categories || candidate.talent_categories || ['Boxer'],
          talent_location: talentProfile?.location || candidate.talent_location || 'Unknown Location',
          talent_image_url: talentProfile?.profile_image_url || candidate.talent_image_url,
          // Add promoter name with email fallback
          promoter_name: promoterProfile?.full_name || promoterProfile?.email || 'Unknown Promoter'
        };

        console.log('✅ Enriched candidate:', {
          id: candidate.id,
          talent_name: updatedCandidate.talent_name,
          promoter_name: updatedCandidate.promoter_name,
          talent_email: talentProfile?.email,
          promoter_email: promoterProfile?.email
        });

        return updatedCandidate;
      })
    );

    console.log('✅ Returning enriched candidates:', enrichedCandidates.length);
    return enrichedCandidates;

  } catch (error) {
    console.error('❌ Error fetching candidates by event:', error);
    return [];
  }
};

export const groupCandidatesByEvent = (candidates: Candidate[]): Record<string, Candidate[]> => {
  return candidates.reduce((groups, candidate) => {
    const eventTitle = candidate.event_title;
    if (!groups[eventTitle]) {
      groups[eventTitle] = [];
    }
    groups[eventTitle].push(candidate);
    return groups;
  }, {} as Record<string, Candidate[]>);
};
