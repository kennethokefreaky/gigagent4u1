"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EventData {
  selectedTalents: string[];
  selectedWeightClasses: string[];
  coverPhoto: string | null;
  gigTitle: string;
  gigDescription: string;
  address: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  gigAmount: string;
}

// Safe normalization function to ensure all required fields exist
const normalizeEventData = (data: any): EventData => ({
  selectedTalents: data?.selectedTalents || [],
  selectedWeightClasses: data?.selectedWeightClasses || [],
  coverPhoto: data?.coverPhoto || null,
  gigTitle: data?.gigTitle || "",
  gigDescription: data?.gigDescription || "",
  address: data?.address || "No address provided",
  startDate: data?.startDate || "",
  endDate: data?.endDate || "",
  startTime: data?.startTime || "",
  endTime: data?.endTime || "",
  gigAmount: data?.gigAmount || "",
});

export default function PostPreviewPage() {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('eventData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setEventData(normalizeEventData(parsedData));
      } catch (error) {
        console.error('Error parsing event data:', error);
        router.push("/create");
      }
    } else {
      // Redirect back to create if no data
      router.push("/create");
    }
  }, [router]);

  const handleClose = () => {
    router.push("/create");
  };

  const handlePreviewEventDetails = () => {
    router.push("/eventdetailpreview");
  };

  const handleEditPost = () => {
    // Navigate to create page without clearing sessionStorage
    // The CreateEventPage will hydrate its state from the stored eventData
    router.push("/create");
  };

  const getAmountLabel = () => {
    if (!eventData) return "Booking rate";
    
    if (eventData.selectedTalents.includes("Boxer") || eventData.selectedTalents.includes("MMA")) {
      return "Fight purse per match";
    } else if (eventData.selectedTalents.includes("Comedian")) {
      return "Show fee";
    } else if (eventData.selectedTalents.includes("Musician")) {
      return "Performance fee (per gig)";
    } else {
      return "Booking rate";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!eventData) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-text-secondary">
        <button
          onClick={handleClose}
          className="p-2 hover:bg-surface rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-heading font-bold text-center flex-1 mr-10">
          Preview Post
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Event Preview Card */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          {/* Event Photo */}
          {eventData.coverPhoto && (
            <div className="relative">
              <img 
                src={eventData.coverPhoto} 
                alt="Event cover" 
                className="w-full h-48 object-cover"
              />
              {/* Tags */}
              <div className="absolute top-3 left-3">
                <span className="bg-white text-black px-2 py-1 rounded-full text-xs font-medium">
                  New Post
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="bg-white text-black px-2 py-1 rounded-full text-xs font-medium">
                  {eventData.selectedTalents[0] || "Event"}
                </span>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="p-4">
            {/* Gig Title */}
            <h2 className="text-xl font-bold text-black mb-2">
              {eventData.gigTitle}
            </h2>

            {/* Talent Type and Weight Class Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {eventData.selectedTalents.map((talent, index) => (
                <span
                  key={index}
                  className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                >
                  {talent}
                </span>
              ))}
              {eventData.selectedWeightClasses.length > 0 && eventData.selectedTalents.includes("Boxer") && (
                <>
                  {eventData.selectedWeightClasses.length === 17 ? (
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      All Weight Classes
                    </span>
                  ) : (
                    eventData.selectedWeightClasses.map((weightClass, index) => (
                      <span
                        key={index}
                        className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {weightClass}
                      </span>
                    ))
                  )}
                </>
              )}
            </div>

            {/* Date Range */}
            <p className="text-gray-600 text-sm mb-1">
              {formatDate(eventData.startDate)} - {formatDate(eventData.endDate)}
            </p>

            {/* Time Range */}
            <p className="text-gray-600 text-sm mb-1">
              {eventData.startTime} - {eventData.endTime} EDT
            </p>

            {/* Address */}
            <p className="text-gray-600 text-sm mb-3">
              {eventData.address}
            </p>

            {/* Gig Price */}
            <p className="text-black font-medium">
              {getAmountLabel()}: ${eventData.gigAmount}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handlePreviewEventDetails}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold transition-colors"
          >
            Preview Event Details
          </button>
          
          <button
            onClick={handleEditPost}
            className="w-full bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 py-4 rounded-xl font-semibold transition-colors"
          >
            Edit Post
          </button>
        </div>
      </div>
    </div>
  );
}

