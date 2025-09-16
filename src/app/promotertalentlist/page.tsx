"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllTalentUsers, TalentUser } from "../../utils/eventUtils";

interface Talent {
  id: string;
  name: string;
  categories: string[];
  avatar?: string;
  location?: string;
  rating?: number;
}

export default function PromoterTalentListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [acceptedTalents, setAcceptedTalents] = useState<string[]>([]);

  // Load real talent data from Supabase
  useEffect(() => {
    const loadTalents = async () => {
      try {
        const talentUsers = await getAllTalentUsers();
        
        // Convert TalentUser to Talent format
        const talentsData: Talent[] = talentUsers.map((user: TalentUser) => ({
          id: user.id,
          name: user.email.split('@')[0], // Use email username as name for now
          categories: user.talent_categories || [],
          location: "Location not set", // Default location
          rating: 4.5 // Default rating
        }));
        
        setTalents(talentsData);
        setFilteredTalents(talentsData);
      } catch (error) {
        console.error('Error loading talents:', error);
        // Fallback to empty array if error
        setTalents([]);
        setFilteredTalents([]);
      }
    };
    
    loadTalents();
  }, []);

  // Filter talents based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTalents(talents);
    } else {
      const filtered = talents.filter(talent =>
        talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talent.categories.some(cat => 
          cat.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredTalents(filtered);
    }
  }, [searchQuery, talents]);

  // Load accepted talents from user's profile on component mount
  useEffect(() => {
    const loadAcceptedTalents = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("No authenticated user:", authError);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('accepted_talents')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError);
          return;
        }

        const acceptedTalents = profile?.accepted_talents || [];
        setAcceptedTalents(acceptedTalents);
      } catch (error) {
        console.error('Error loading accepted talents:', error);
      }
    };

    loadAcceptedTalents();
  }, []);

  const handleAcceptTalent = async (talentId: string) => {
    try {
      // Get current user
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("No authenticated user:", authError);
        return;
      }

      // Get current accepted talents from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('accepted_talents')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        return;
      }

      const currentAcceptedTalents = profile?.accepted_talents || [];
      const newAcceptedTalents = currentAcceptedTalents.includes(talentId)
        ? currentAcceptedTalents.filter((id: string) => id !== talentId)
        : [...currentAcceptedTalents, talentId];

      // Update profile with new accepted talents
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          accepted_talents: newAcceptedTalents,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Error updating accepted talents:", updateError);
        return;
      }

      // Update local state
      setAcceptedTalents(newAcceptedTalents);
      
      // Create notification for the promoter
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'talent_accepted',
        title: 'Talent Accepted!',
        message: 'You have successfully accepted a talent for your events.',
        button_text: 'View Talents',
        icon: '👥',
        show_confetti: false,
        is_read: false
      });
      
      // Dispatch custom event to notify GoalSection
      window.dispatchEvent(new CustomEvent('talentAccepted'));
      
    } catch (error) {
      console.error('Error accepting talent:', error);
    }
  };

  const renderTalentCard = (talent: Talent) => (
    <div key={talent.id} className="bg-gray-800 rounded-xl p-4 mb-3">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>

        {/* Name and Categories */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base mb-2 truncate">
            {talent.name}
          </h3>
          
          {/* Categories as white pillars with black text */}
          <div className="flex flex-wrap gap-2 mb-2">
            {talent.categories.map((category, index) => (
              <span
                key={index}
                className="bg-white text-black px-3 py-1 rounded-full text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
          
          {talent.location && (
            <p className="text-gray-400 text-xs">
              {talent.location}
            </p>
          )}
        </div>

        {/* Accept Talent Button */}
        <button
          onClick={() => handleAcceptTalent(talent.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            acceptedTalents.includes(talent.id)
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {acceptedTalents.includes(talent.id) ? "Accepted" : "Accept Talent"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-4 flex items-center justify-between border-b border-gray-700">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-white">
          Accept Talent
        </h1>
        
        <div className="w-6"></div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="bg-gray-700 rounded-lg px-4 py-3 flex items-center space-x-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by name or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-20">
        {filteredTalents.length > 0 ? (
          <div>
            {filteredTalents.map(renderTalentCard)}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-white font-bold text-lg mb-2">No talent found</h2>
              <p className="text-gray-400 text-sm">Try searching with different keywords.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary */}
      {acceptedTalents.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
          <div className="text-center">
            <p className="text-white font-semibold">
              {acceptedTalents.length} talent{acceptedTalents.length > 1 ? 's' : ''} accepted
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
