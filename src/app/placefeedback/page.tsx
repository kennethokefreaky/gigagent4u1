"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  getPlaceFeedback, 
  getPlaceRating, 
  addPlaceFeedback, 
  updatePlaceFeedback,
  deletePlaceFeedback,
  getUserPlaceFeedback,
  getUserLatestPlaceFeedback,
  PlaceFeedback,
  PlaceRating,
  FeedbackFormData
} from "../../utils/placeFeedbackUtils";

export default function PlaceFeedbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState<string>('');
  const [placeAddress, setPlaceAddress] = useState<string>('');
  const [feedback, setFeedback] = useState<PlaceFeedback[]>([]);
  const [placeRating, setPlaceRating] = useState<PlaceRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSavedFeedbackBottomSheet, setShowSavedFeedbackBottomSheet] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<PlaceFeedback[]>([]);
  const [userLatestFeedback, setUserLatestFeedback] = useState<PlaceFeedback | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    rating: 0,
    comment: ''
  });

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Get place data from URL params
        const id = params.get('placeId');
        const name = params.get('placeName');
        const address = params.get('placeAddress');

        if (!id || !name) {
          console.error('Missing place data');
          router.back();
          return;
        }

        // Handle general feedback case
        if (id === 'general_feedback') {
          setPlaceId(id);
          setPlaceName(name);
          setPlaceAddress(address || '');
          setLoading(false);
          return;
        }

        setPlaceId(id);
        setPlaceName(decodeURIComponent(name));
        setPlaceAddress(address ? decodeURIComponent(address) : '');

        // Get current user
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('No authenticated user');
          setCurrentUserId(null);
        } else {
          setCurrentUserId(user.id);
        }

        // Load place data
        await loadPlaceData(id, user?.id);
      } catch (error) {
        console.error('Error initializing page:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [params, router]);

  const loadPlaceData = async (placeId: string, userId?: string) => {
    try {
      // Load place rating and feedback
      const [ratingData, feedbackData] = await Promise.all([
        getPlaceRating(placeId),
        getPlaceFeedback(placeId)
      ]);

      setPlaceRating(ratingData);
      setFeedback(feedbackData);

      // Load user's existing feedback if logged in
      if (userId) {
        const [userFeedbackData, userLatestFeedbackData] = await Promise.all([
          getUserPlaceFeedback(placeId, userId),
          getUserLatestPlaceFeedback(placeId, userId)
        ]);
        setUserFeedback(userFeedbackData);
        setUserLatestFeedback(userLatestFeedbackData);
        // Don't pre-fill form - always start fresh for new reviews
      }
    } catch (error) {
      console.error('Error loading place data:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!currentUserId || !placeId) return;

    try {
      // For general feedback, we need to prompt user to specify the place
      if (placeId === 'general_feedback') {
        const placeName = prompt('Please enter the name of the place you want to review:');
        if (!placeName) return;
        
        const placeAddress = prompt('Please enter the address (optional):') || '';
        
        // Update the place data with user input
        setPlaceName(placeName);
        setPlaceAddress(placeAddress);
        
        // Generate a unique place ID for this general feedback
        const generalPlaceId = `general_${placeName.replace(/\s+/g, '_')}_${Date.now()}`;
        setPlaceId(generalPlaceId);
      }

      const feedbackData: FeedbackFormData = {
        place_id: placeId,
        place_name: placeName,
        place_address: placeAddress,
        rating: formData.rating,
        comment: formData.comment,
        feedback_type: 'review'
      };

      // Always create new feedback (never update existing)
      const result = await addPlaceFeedback(currentUserId, feedbackData);

      if (result) {
        // Reload data
        await loadPlaceData(placeId, currentUserId);
        setShowAddForm(false);
        // Clear form for next review
        setFormData({ rating: 0, comment: '' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!currentUserId) return;

    try {
      const success = await deletePlaceFeedback(feedbackId, currentUserId);
      if (success) {
        await loadPlaceData(placeId!, currentUserId);
        setFormData({ rating: 0, comment: '' });
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => setFormData({...formData, rating: star}) : undefined}
            className={`w-6 h-6 ${
              interactive ? 'cursor-pointer' : 'cursor-default'
            }`}
            disabled={!interactive}
          >
            <svg
              className={`w-full h-full ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill={star <= rating ? 'currentColor' : 'none'}
              stroke={star <= rating ? 'none' : 'currentColor'}
              strokeWidth={star <= rating ? 0 : 1}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <button
          onClick={() => {
            // Navigate back to map with bottom sheet open and selected place
            if (placeId && placeName) {
              const params = new URLSearchParams({
                showBottomsheet: 'true',
                selectedPlaceId: placeId,
                selectedPlaceName: placeName,
                selectedPlaceAddress: placeAddress || ''
              });
              
              // Preserve search context from current URL parameters
              const currentParams = new URLSearchParams(window.location.search);
              const returnSearchQuery = currentParams.get('returnSearchQuery');
              const returnShowSearchResults = currentParams.get('returnShowSearchResults');
              const returnSearchResultsCount = currentParams.get('returnSearchResultsCount');
              
              if (returnSearchQuery) {
                params.set('returnSearchQuery', returnSearchQuery);
                params.set('returnShowSearchResults', returnShowSearchResults || 'false');
                params.set('returnSearchResultsCount', returnSearchResultsCount || '0');
              }
              
              router.push(`/map?${params.toString()}`);
            } else {
              router.back();
            }
          }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900 truncate max-w-xs">{placeName}</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Rating Summary Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{placeName}</h2>
            {placeAddress && (
              <p className="text-gray-600 text-sm">{placeAddress}</p>
            )}
          </div>
          
          {/* Overall Rating */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center space-x-2 mb-2">
              {renderStars(Math.round(placeRating?.average_rating || 0))}
              <span className="text-3xl font-bold text-gray-900 ml-2">
                {placeRating?.average_rating?.toFixed(1) || '0.0'}
              </span>
            </div>
            <div className="text-gray-600 text-sm">
              Based on {placeRating?.total_ratings || 0} reviews
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {placeRating?.total_comments || 0}
            </div>
          </div>

        </div>


        {/* Reviews List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reviews ({feedback.length})
          </h3>
          
          {feedback.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-600 mb-2">No reviews yet</p>
              <p className="text-gray-500 text-sm">Be the first to share your experience!</p>
            </div>
          ) : (
            feedback.map((item) => {
              const isUserReview = currentUserId && item.user_id === currentUserId;
              return (
                <div key={item.id} className={`rounded-2xl p-6 shadow-sm ${
                  isUserReview ? 'bg-blue-50 border border-blue-200' : 'bg-white'
                }`}>
                  <div className="flex items-start space-x-4">
                    {/* User Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      isUserReview ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {(item.user_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {item.user_name || 'Anonymous'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isUserReview 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.user_role || 'user'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        {item.rating && renderStars(item.rating)}
                        <span className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {item.comment && (
                        <p className="text-gray-700 leading-relaxed mb-3">{item.comment}</p>
                      )}
                      
                      {isUserReview && (
                        <button
                          onClick={() => handleDeleteFeedback(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Review Section - Below Reviews */}
        {currentUserId && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Review</h3>
            
            {/* Star Rating Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate this place?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFormData({...formData, rating: star})}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      star <= formData.rating 
                        ? 'bg-black text-white scale-110' 
                        : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                    }`}
                  >
                    <svg 
                      className="w-6 h-6" 
                      fill={star <= formData.rating ? 'currentColor' : 'none'} 
                      stroke={star <= formData.rating ? 'none' : 'currentColor'}
                      strokeWidth={star <= formData.rating ? 0 : 1}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="text-center mt-2">
                <span className="text-sm text-gray-600">
                  {formData.rating === 0 ? 'Tap a star to rate' : 
                   formData.rating === 1 ? 'Poor' :
                   formData.rating === 2 ? 'Fair' :
                   formData.rating === 3 ? 'Good' :
                   formData.rating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              </div>
            </div>

            {/* Review Input Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowSavedFeedbackBottomSheet(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-left hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div>
                    <div className="text-gray-900 font-medium">Write a review</div>
                    <div className="text-gray-500 text-sm">Share your experience with others</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSubmitFeedback}
              disabled={formData.rating === 0}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                formData.rating === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Add Review
            </button>
          </div>
        )}
      </div>

      {/* Saved Feedback Bottom Sheet */}
      {showSavedFeedbackBottomSheet && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Saved Feedback</h3>
              <button
                onClick={() => setShowSavedFeedbackBottomSheet(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4">
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                placeholder="Share your experience with this place..."
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                rows={6}
              />
              
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowSavedFeedbackBottomSheet(false)}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSavedFeedbackBottomSheet(false);
                    handleSubmitFeedback();
                  }}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
