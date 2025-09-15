"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Talent {
  id: string;
  name: string;
  categories: string[];
  avatar?: string;
  location?: string;
  rating?: number;
}

export default function TalentListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [invitedTalents, setInvitedTalents] = useState<string[]>([]);

  // Mock talent data - in real app, this would come from an API
  useEffect(() => {
    const mockTalents: Talent[] = [
      {
        id: "1",
        name: "Alex Rodriguez",
        categories: ["Boxer", "MMA"],
        location: "New York, NY",
        rating: 4.9
      },
      {
        id: "2", 
        name: "Sarah Johnson",
        categories: ["Comedian"],
        location: "Los Angeles, CA",
        rating: 4.8
      },
      {
        id: "3",
        name: "Mike Thompson",
        categories: ["Musician", "Comedian"],
        location: "Chicago, IL",
        rating: 4.7
      },
      {
        id: "4",
        name: "Emma Davis",
        categories: ["Wrestler", "Boxer"],
        location: "Miami, FL",
        rating: 4.9
      },
      {
        id: "5",
        name: "James Wilson",
        categories: ["Musician"],
        location: "Austin, TX",
        rating: 4.6
      },
      {
        id: "6",
        name: "Lisa Chen",
        categories: ["Comedian", "Musician"],
        location: "Seattle, WA",
        rating: 4.8
      }
    ];
    setTalents(mockTalents);
    setFilteredTalents(mockTalents);
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

  // Load invited talents from localStorage on component mount
  useEffect(() => {
    const savedInvitedTalents = localStorage.getItem('invitedTalents');
    if (savedInvitedTalents) {
      try {
        const talents = JSON.parse(savedInvitedTalents);
        setInvitedTalents(talents);
      } catch (error) {
        console.error('Error parsing invited talents:', error);
      }
    }
  }, []);

  const handleInviteTalent = (talentId: string) => {
    setInvitedTalents(prev => {
      const newInvitedTalents = prev.includes(talentId) 
        ? prev.filter(id => id !== talentId)
        : [...prev, talentId];
      
      // Save to localStorage for goal tracking
      localStorage.setItem('invitedTalents', JSON.stringify(newInvitedTalents));
      
      // Dispatch custom event to notify GoalSection
      window.dispatchEvent(new CustomEvent('talentInvited'));
      
      return newInvitedTalents;
    });
  };

  const renderTalentCard = (talent: Talent) => (
    <div key={talent.id} className="bg-surface rounded-xl p-4 mb-3">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-input-background rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>

        {/* Name and Categories */}
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-base mb-1 truncate">
            {talent.name}
          </h3>
          <p className="text-text-secondary text-sm">
            {talent.categories.join(", ")}
          </p>
          {talent.location && (
            <p className="text-text-secondary text-xs mt-1">
              {talent.location}
            </p>
          )}
        </div>

        {/* Send Invite Button */}
        <button
          onClick={() => handleInviteTalent(talent.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            invitedTalents.includes(talent.id)
              ? "bg-button-red text-white"
              : "bg-button-red text-white hover:bg-button-red-hover"
          }`}
        >
          {invitedTalents.includes(talent.id) ? "Invited" : "Send Invite"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-text-primary hover:text-text-secondary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-text-primary">
          Invite Talent
        </h1>
        
        <div className="w-6"></div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="bg-input-background rounded-lg px-4 py-3 flex items-center space-x-3">
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by name or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary outline-none"
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
              <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-text-primary font-bold text-lg mb-2">No talent found</h2>
              <p className="text-text-secondary text-sm">Try searching with different keywords.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary */}
      {invitedTalents.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-text-secondary p-4">
          <div className="text-center">
            <p className="text-text-primary font-semibold">
              {invitedTalents.length} talent{invitedTalents.length > 1 ? 's' : ''} invited
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
