'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EditOfferData {
  id: string;
  offer_amount: number;
  event_name: string;
  promoter_name: string;
  promoter_id: string;
  event_id: string;
}

export default function EditOfferPage() {
  const router = useRouter();
  const [offerData, setOfferData] = useState<EditOfferData | null>(null);
  const [counterOfferAmount, setCounterOfferAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    console.log('🔍 EditOfferPage useEffect running...');
    
    // Get notification data from sessionStorage
    const storedData = sessionStorage.getItem('editOfferData');
    console.log('🔍 Stored data from sessionStorage:', storedData);
    
    if (storedData && storedData !== 'null' && storedData !== 'undefined') {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('🔍 Parsed data:', parsedData);
        
        // Set the data immediately
        setOfferData(parsedData);
        
        // Clear the stored data after reading
        sessionStorage.removeItem('editOfferData');
        console.log('🔍 Data loaded successfully, offerData set');
        
      } catch (error) {
        console.error('Error parsing edit offer data:', error);
        // Don't redirect immediately, show error and let user fix it
        alert('Error loading offer data: ' + error.message);
      }
    } else {
      console.log('🔍 No stored data found, showing error message');
      // Instead of redirecting, show a helpful message
      alert('No offer data found. Please go back to notifications and try again.');
      // Only redirect after a delay
      setTimeout(() => {
        router.push('/notifications');
      }, 2000);
    }
  }, [router]);

  const handleSendCounterOffer = async () => {
    if (!offerData || !counterOfferAmount) return;

    setSending(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        alert('Authentication error. Please try again.');
        setSending(false);
        return;
      }

      // Validate offer data
      if (!offerData.promoter_id || !offerData.event_id || !offerData.event_name) {
        console.error('Invalid offer data:', offerData);
        alert('Invalid offer data. Please try again.');
        setSending(false);
        return;
      }

      // Create notification for promoter about counter offer
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: offerData.promoter_id,
          type: 'counter_offer',
          title: 'Counter Offer Received',
          message: `A talent has made a counter offer of $${counterOfferAmount} for your event "${offerData.event_name}". Do you want to accept this counter offer?`,
          offer_amount: parseFloat(counterOfferAmount),
          event_name: offerData.event_name,
          promoter_id: offerData.promoter_id,
          talent_id: user.id,
          event_id: offerData.event_id,
          notification_data: {
            original_notification_id: offerData.id,
            counter_offer_amount: parseFloat(counterOfferAmount),
            talent_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown Talent'
          }
        });

      if (notificationError) {
        console.error('Error creating counter offer notification:', notificationError);
        return;
      }

      // Update the original notification to show it's been responded to
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          status: 'responded',
          notification_data: {
            ...offerData,
            counter_offer_amount: parseFloat(counterOfferAmount),
            responded_at: new Date().toISOString()
          }
        })
        .eq('id', offerData.id);

      if (updateError) {
        console.error('Error updating original notification:', updateError);
      }

      // Show success popup
      setShowSuccessPopup(true);
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        router.push('/notifications');
      }, 2000);

    } catch (error) {
      console.error('Error sending counter offer:', error);
      alert('Error sending counter offer. Please try again.');
      setSending(false);
    }
  };

  const handleKeypadInput = (key: string | number) => {
    if (key === "⌫") {
      setCounterOfferAmount(prev => prev.slice(0, -1));
    } else if (key === ".") {
      if (!counterOfferAmount.includes(".")) {
        setCounterOfferAmount(prev => prev + ".");
      }
    } else {
      setCounterOfferAmount(prev => prev + key.toString());
    }
  };

  if (!offerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-text-primary text-lg mb-4">Loading offer data...</div>
          <button
            onClick={() => router.push('/notifications')}
            className="bg-button-red text-white px-6 py-2 rounded-lg hover:bg-button-red-hover transition-colors"
          >
            Back to Notifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <button
          onClick={() => router.back()}
          className="text-button-red font-semibold"
        >
          Cancel
        </button>
        <h1 className="text-text-primary font-bold text-lg">Edit Offer</h1>
        <div className="w-16"></div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Original Offer Display */}
        <div className="bg-surface rounded-xl p-4 mb-6 border border-text-secondary">
          <div className="text-center mb-4">
            <p className="text-text-secondary text-sm mb-2">Original Offer</p>
            <p className="text-3xl font-bold text-text-primary">${offerData.offer_amount}</p>
            <p className="text-text-secondary text-sm mt-2">
              From {offerData.promoter_name} for event &quot;{offerData.event_name}&quot;
            </p>
          </div>
        </div>

        {/* Counter Offer Section */}
        <div className="bg-surface rounded-xl p-4 mb-6 border border-text-secondary">
          <div className="text-center mb-4">
            <p className="text-text-secondary text-sm mb-2">Your Counter Offer</p>
            <p className="text-3xl font-bold text-text-primary">${counterOfferAmount || "0"}</p>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "⌫"].map((key) => (
              <button
                key={key}
                onClick={() => handleKeypadInput(key)}
                className="bg-input-background border border-text-secondary rounded-xl p-4 text-text-primary font-semibold hover:bg-surface transition-colors"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Send Counter Offer Button */}
          <button
            onClick={handleSendCounterOffer}
            disabled={!counterOfferAmount || sending}
            className="w-full bg-button-red text-white py-4 rounded-xl font-semibold hover:bg-button-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Counter Offer'}
          </button>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Counter Offer Sent!</h3>
            <p className="text-text-secondary text-sm mb-4">
              Your counter offer of ${counterOfferAmount} has been sent to {offerData.promoter_name}. 
              They will be notified and can accept or decline your offer.
            </p>
            <p className="text-text-secondary text-xs">
              Redirecting to notifications...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
