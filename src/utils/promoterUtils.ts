import { supabase } from '@/lib/supabaseClient';

export interface PromoterEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  amount: string;
  cover_photo?: string;
  talents: string[];
  weight_classes: string[];
  promoter_id: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export const hasPromoterCreatedEvents = async (promoterId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .eq('promoter_id', promoterId)
      .limit(1);

    if (error) {
      console.error('Error checking if promoter has created events:', error);
      return false;
    }

    return (data && data.length > 0) || false;
  } catch (error) {
    console.error('Error checking if promoter has created events:', error);
    return false;
  }
};

export const getPromoterEvents = async (promoterId: string): Promise<PromoterEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('promoter_id', promoterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promoter events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching promoter events:', error);
    return [];
  }
};

export const getPromoterLatestEvent = async (promoterId: string): Promise<PromoterEvent | null> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('promoter_id', promoterId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching promoter latest event:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching promoter latest event:', error);
    return null;
  }
};
