"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllTalentUsers, TalentUser } from "../../utils/eventUtils";
import { hasPromoterCreatedEvents, getPromoterLatestEvent, PromoterEvent } from "../../utils/promoterUtils";
import { createOfferNotification } from "../../utils/offerUtils";
import { hasOfferBeenSent, hasOfferBeenSentForEvent, hasTalentAcceptedOfferFromPromoter } from "../../utils/offerManagement";

interface Talent {
  id: string;
  name: string;
  categories: string[];
  avatar?: string;
  location?: string;
  rating?: number;
  imageUrl?: string; // Add imageUrl to Talent interface
}

export default function PromoterTalentListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [showOfferBottomSheet, setShowOfferBottomSheet] = useState(false);
  const [selectedTalentForOffer, setSelectedTalentForOffer] = useState<Talent | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [hasCreatedEvents, setHasCreatedEvents] = useState<boolean>(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [latestEvent, setLatestEvent] = useState<PromoterEvent | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sentOffers, setSentOffers] = useState<Set<string>>(new Set());
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Load real talent data from Supabase
  useEffect(() => {
    const loadTalents = async () => {
      try {
        const talentUsers = await getAllTalentUsers();
        console.log('PromoterTalentList: Fetched talent users:', talentUsers);
        
        // Convert TalentUser to Talent format
        const talentsData: Talent[] = talentUsers.map((user: TalentUser) => ({
          id: user.id,
          name: user.full_name || user.email || `User ${user.id.slice(0, 8)}`, // Use full_name first, then email, then fallback to User ID
          categories: user.talent_categories || [],
          location: user.location || "Location not set", // Use actual location if available
          rating: 4.5, // Default rating
          imageUrl: user.profile_image_url // Add profile image URL
        }));
        
        console.log('PromoterTalentList: Converted talents data:', talentsData);
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

  // Get current user ID and check if they have created events
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
        
        if (user?.id) {
          // Check if promoter has created events
          const hasEvents = await hasPromoterCreatedEvents(user.id);
          setHasCreatedEvents(hasEvents);
          
          if (hasEvents) {
            // Get the latest event for offer context
            const latest = await getPromoterLatestEvent(user.id);
            setLatestEvent(latest);
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setCurrentUserId(null);
        setHasCreatedEvents(false);
      }
    };
    
    getCurrentUser();
  }, []);

  // Load sent offers from Supabase (event-specific)
  useEffect(() => {
    const loadSentOffers = async () => {
      if (!currentUserId || !latestEvent?.id) return;
      
      try {
        const sentOffersSet = new Set<string>();
        
        // Check each talent to see if an offer has been sent for this specific event
        // OR if they have already accepted an offer from this promoter
        for (const talent of talents) {
          const hasOffer = await hasOfferBeenSentForEvent(currentUserId, talent.id, latestEvent.id);
          const hasAccepted = await hasTalentAcceptedOfferFromPromoter(talent.id, currentUserId);
          
          if (hasOffer || hasAccepted) {
            sentOffersSet.add(talent.id);
          }
        }
        
        setSentOffers(sentOffersSet);
      } catch (error) {
        console.error('Error loading sent offers:', error);
      }
    };
    
    if (talents.length > 0 && currentUserId && latestEvent?.id) {
      loadSentOffers();
    }
  }, [talents, currentUserId, latestEvent?.id]);

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

  const handleAskOffer = (talent: Talent) => {
    if (!hasCreatedEvents) {
      setShowCreateEventModal(true);
      return;
    }
    
    setSelectedTalentForOffer(talent);
    setOfferAmount("");
    setShowOfferBottomSheet(true);
  };

  const handleSendOffer = async () => {
    if (!selectedTalentForOffer || !offerAmount || !currentUserId) return;

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('No authenticated user:', authError);
        return;
      }

      // Use the latest event for the offer
      const eventTitle = latestEvent?.title || "Recent Event";
      const eventId = latestEvent?.id;

      // Create offer notification for talent
      const offerNotification = await createOfferNotification(
        selectedTalentForOffer.id, // talentId
        currentUserId, // promoterId
        offerAmount,
        eventTitle,
        eventId
      );

      if (!offerNotification) {
        console.error('Failed to create offer notification');
        return;
      }

      console.log('Offer sent successfully to talent:', selectedTalentForOffer.name);
      
      // Add to sent offers
      const newSentOffers = new Set(sentOffers);
      newSentOffers.add(selectedTalentForOffer.id);
      setSentOffers(newSentOffers);
      
      // Show success popup
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);

      // Close bottom sheet
      setShowOfferBottomSheet(false);
      setSelectedTalentForOffer(null);
      setOfferAmount("");
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  };


  const renderTalentCard = (talent: Talent) => (
    <div key={talent.id} className="bg-surface rounded-xl p-4 mb-3">
      <div className="flex items-center space-x-4">
        {/* Avatar or Profile Image */}
        {talent.imageUrl ? (
          <img 
            src={talent.imageUrl} 
            alt={talent.name} 
            className="w-12 h-12 rounded-full object-cover flex-shrink-0" 
          />
        ) : (
          <div className="w-12 h-12 bg-input-background rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}

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

        {/* Ask Offer Button */}
        <button
          onClick={() => handleAskOffer(talent)}
          disabled={sentOffers.has(talent.id) || !hasCreatedEvents}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            sentOffers.has(talent.id)
              ? "bg-gray-400 text-white cursor-not-allowed"
              : !hasCreatedEvents
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-button-red text-white hover:bg-button-red-hover"
          }`}
        >
          {sentOffers.has(talent.id) 
            ? "Already Connected" 
            : !hasCreatedEvents 
            ? "Create Event First" 
            : "Ask Offer"
          }
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
          Accept Talent
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
              {talents.length === 0 ? (
                <>
                  <h2 className="text-text-primary font-bold text-lg mb-2">No Talent Available</h2>
                  <p className="text-text-secondary text-sm">No talent has signed up yet. Check back later for available candidates.</p>
                </>
              ) : (
                <>
                  <h2 className="text-text-primary font-bold text-lg mb-2">No talent found</h2>
                  <p className="text-text-secondary text-sm">Try searching with different keywords.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Offer Bottom Sheet */}
      {showOfferBottomSheet && selectedTalentForOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 min-h-[50vh]">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setOfferAmount("")}
                className="text-button-red font-semibold"
              >
                Reset
              </button>
              <h3 className="text-text-primary font-semibold text-lg">Make Offer to {selectedTalentForOffer.name}</h3>
              <button
                onClick={() => setShowOfferBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Cancel
              </button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-text-secondary text-sm mb-2">Offer Amount in USD</p>
              <p className="text-3xl font-bold text-text-primary">${offerAmount || "0"}</p>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "⌫"].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "⌫") {
                      setOfferAmount(prev => prev.slice(0, -1));
                    } else if (key === ".") {
                      if (!offerAmount.includes(".")) {
                        setOfferAmount(prev => prev + ".");
                      }
                    } else {
                      setOfferAmount(prev => prev + key.toString());
                    }
                  }}
                  className="bg-input-background border border-text-secondary rounded-xl p-4 text-text-primary font-semibold hover:bg-surface transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendOffer}
              disabled={!offerAmount || parseFloat(offerAmount) <= 0}
              className="w-full bg-button-red text-white py-4 rounded-xl font-semibold text-lg hover:bg-button-red-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Send Offer
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Modal Content */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your First Event</h3>
              <p className="text-gray-600 mb-6">
                You must create your first post or have an existing post under your event before you can invite talent.
              </p>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowCreateEventModal(false);
                    router.push('/create');
                  }}
                  className="w-full bg-button-red text-white py-3 rounded-xl font-semibold hover:bg-button-red-hover transition-colors"
                >
                  Create Event
                </button>
                
                <button
                  onClick={() => setShowCreateEventModal(false)}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Success Content */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Offer Sent!</h3>
              <p className="text-gray-600">
                Your offer has been sent to {selectedTalentForOffer?.name || 'the talent'}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
