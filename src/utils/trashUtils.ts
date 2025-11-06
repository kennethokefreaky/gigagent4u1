import { supabase } from '@/lib/supabaseClient';
import { EventData } from './eventUtils';

export interface TrashEventData extends EventData {
  source: 'trash';
  removed_at: string;
  removed_by: string;
  reason: string;
}

// Get past events including those in trash
export const getPastEventsWithTrash = async (userId: string): Promise<EventData[]> => {
  console.log('🔍 getPastEventsWithTrash called for user:', userId);
  
  try {
    // Get all events from posts table (since there's no status column)
    console.log('📋 Fetching posts from database...');
    const { data: postsEvents, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('promoter_id', userId)
      .order('created_at', { ascending: false });

    console.log('Posts query result:', { postsEvents: postsEvents?.length, postsError });

    if (postsError) {
      console.error('❌ Error fetching posts events:', postsError);
      // Continue with empty array instead of failing
    }

    // Get removed events from trash table (with error handling)
    console.log('🗑️ Fetching trash events...');
    let trashEvents = [];
    try {
      const { data, error: trashError } = await supabase
        .from('trash')
        .select('*')
        .eq('removed_by', userId)
        .order('removed_at', { ascending: false });

      console.log('Trash query result:', { trashEvents: data?.length, trashError });

      if (trashError) {
        console.error('❌ Error fetching trash events:', trashError);
        // If trash table doesn't exist yet, just continue with empty array
        if (trashError.code === 'PGRST116' || trashError.message?.includes('relation "trash" does not exist')) {
          console.log('📋 Trash table does not exist yet, skipping trash events');
          console.log('💡 To fix this, run the create-trash-table.sql script in Supabase SQL editor');
        }
      } else {
        trashEvents = data || [];
        console.log('✅ Trash events found:', trashEvents.length);
        if (trashEvents.length > 0) {
          console.log('📋 Trash events details:', trashEvents.map(t => ({ 
            id: t.original_post_id, 
            title: t.post_data?.title,
            removed_at: t.removed_at 
          })));
        }
      }
    } catch (trashTableError) {
      console.log('⚠️ Trash table not available, skipping trash events:', trashTableError);
      trashEvents = [];
    }

    // Don't show any active posts in past events - only show trashed posts
    const convertedPostsEvents: EventData[] = [];
    console.log('📊 Active posts to show in past events:', convertedPostsEvents.length);

    // Convert trash events to EventData format
    console.log('🔄 Converting trash events to EventData format...');
    const convertedTrashEvents: EventData[] = trashEvents.map(trash => {
      const postData = trash.post_data;
      return {
        id: postData.id,
        selectedTalents: postData.talents || [],
        selectedWeightClasses: postData.weight_classes || [],
        coverPhoto: postData.cover_photo,
        gigTitle: postData.title,
        gigDescription: postData.description,
        address: postData.location,
        startDate: postData.start_date,
        endDate: postData.end_date,
        startTime: postData.start_time,
        endTime: postData.end_time,
        gigAmount: postData.amount,
        createdAt: postData.created_at,
        status: 'cancelled' as const, // Trash events are always cancelled
        promoterId: postData.promoter_id,
        source: 'trash'
      };
    });

    console.log('📊 Converted trash events:', convertedTrashEvents.length);

    // Combine and sort by date
    const allPastEvents = [...convertedPostsEvents, ...convertedTrashEvents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // CRITICAL FIX: Remove duplicates based on event ID
    const uniquePastEvents = allPastEvents.reduce((acc, current) => {
      const existingEvent = acc.find(event => event.id === current.id);
      if (!existingEvent) {
        acc.push(current);
      } else {
        // If duplicate found, prefer the trash version (source: 'trash')
        if (current.source === 'trash' && existingEvent.source !== 'trash') {
          const index = acc.findIndex(event => event.id === current.id);
          acc[index] = current;
        }
      }
      return acc;
    }, [] as EventData[]);

    console.log('✅ Final past events count (before dedupe):', allPastEvents.length);
    console.log('✅ Final past events count (after dedupe):', uniquePastEvents.length);
    console.log('📋 Past events details:', uniquePastEvents.map(e => ({ id: e.id, title: e.gigTitle, source: e.source })));

    return uniquePastEvents;
  } catch (error) {
    console.error('Error fetching past events with trash:', error);
    return [];
  }
};

// Get trash events for a specific user
export const getTrashEvents = async (userId: string): Promise<TrashEventData[]> => {
  try {
    const { data, error } = await supabase
      .from('trash')
      .select('*')
      .eq('removed_by', userId)
      .order('removed_at', { ascending: false });

    if (error) {
      console.error('Error fetching trash events:', error);
      return [];
    }

    return (data || []).map(trash => {
      const postData = trash.post_data;
      return {
        id: postData.id,
        selectedTalents: postData.talents || [],
        selectedWeightClasses: postData.weight_classes || [],
        coverPhoto: postData.cover_photo,
        gigTitle: postData.title,
        gigDescription: postData.description,
        address: postData.location,
        startDate: postData.start_date,
        endDate: postData.end_date,
        startTime: postData.start_time,
        endTime: postData.end_time,
        gigAmount: postData.amount,
        createdAt: postData.created_at,
        status: 'cancelled' as const,
        promoterId: postData.promoter_id,
        source: 'trash',
        removed_at: trash.removed_at,
        removed_by: trash.removed_by,
        reason: trash.reason
      };
    });
  } catch (error) {
    console.error('Error fetching trash events:', error);
    return [];
  }
};
