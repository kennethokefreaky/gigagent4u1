"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EventData, saveEvent } from "../../utils/eventUtils";


export default function EventDetailPreviewPage() {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('eventData');
    if (storedData) {
      setEventData(JSON.parse(storedData));
    } else {
      // Redirect back to create if no data
      router.push("/create");
    }
  }, [router]);

  const handleClose = () => {
    router.push("/postpreview");
  };

  const handlePost = () => {
    if (!eventData) return;

    // Use utility function to save the event
    const newEvent = saveEvent(eventData);
    
    router.push("/gigagent4u");
  };

  const handleEdit = () => {
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
          Event Detail Preview
        </h1>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-surface rounded-full transition-colors">
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-surface rounded-full transition-colors">
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        {/* Event Image */}
        {eventData.coverPhoto && (
          <div className="relative">
            <img 
              src={eventData.coverPhoto} 
              alt="Event cover" 
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Event Overview */}
        <div className="bg-white p-4">
          <h1 className="text-2xl font-bold text-black mb-2">
            {eventData.gigTitle}
          </h1>
          <p className="text-gray-600 mb-4">
            {eventData.address}
          </p>
          
          {/* Ratings & Features */}
          <div className="flex space-x-2 mb-4">
            <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-black text-sm">4.9</span>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15V9h4v6H8z" clipRule="evenodd" />
              </svg>
              <span className="text-black text-sm">Featured</span>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span className="text-black text-sm">298 reviews</span>
            </div>
          </div>
        </div>

        {/* Time & Venue Section */}
        <div className="bg-white mx-4 mt-4 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-black mb-4">Time & venue</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-black">
                {formatDate(eventData.startDate)} - {formatDate(eventData.endDate)}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-black">
                {eventData.startTime} - {eventData.endTime} EDT
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-black">{eventData.address}</span>
            </div>
          </div>

          <div className="flex space-x-3 mt-4">
            <button className="flex-1 bg-white border border-gray-300 text-black py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="text-sm">Directions</span>
            </button>
            <button className="flex-1 bg-white border border-gray-300 text-black py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm">Call venue</span>
            </button>
          </div>
        </div>

        {/* Gig Description Section */}
        <div className="bg-white mx-4 mt-4 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-black mb-3">Gig Description</h3>
          <p className="text-gray-600">
            {eventData.gigDescription}
          </p>
        </div>

        {/* Gig Contact Section */}
        <div className="bg-white mx-4 mt-4 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-black mb-3">Gig contact</h3>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-black font-medium">Contact</p>
              <p className="text-gray-600 text-sm">Contact info</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button className="flex-1 bg-white border border-gray-300 text-black py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm">Call</span>
            </button>
            <button className="flex-1 bg-white border border-gray-300 text-black py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-text-secondary p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-primary font-semibold">
              {getAmountLabel()}: ${eventData.gigAmount}
            </p>
            <p className="text-text-secondary text-sm">All fees included</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePost}
              className="bg-button-red hover:bg-button-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Post
            </button>
            <button
              onClick={handleEdit}
              className="bg-white border border-gray-300 text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

