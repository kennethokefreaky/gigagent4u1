"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getChatUsageStats, upgradeToPremium } from "@/utils/chatLimitUtils";

export default function ChatSubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatStats, setChatStats] = useState<{
    totalPromoters: number;
    freeChatsUsed: number;
    freeChatsRemaining: number;
    subscription: any;
  } | null>(null);

  // Get promoter info from URL params
  const promoterId = searchParams?.get('promoterId');
  const eventId = searchParams?.get('eventId');
  const eventTitle = searchParams?.get('eventTitle');

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('No authenticated user:', authError);
          router.push('/welcome');
          return;
        }

        setCurrentUserId(user.id);

        // Get chat usage stats
        const stats = await getChatUsageStats(user.id);
        setChatStats(stats);
      } catch (error) {
        console.error('Error getting current user:', error);
        router.push('/welcome');
      }
    };

    getCurrentUser();
  }, [router]);

  const handleSubscribe = async () => {
    if (!currentUserId) return;

    console.log('🔍 User subscribing to premium chat');
    console.log('🔍 Promoter ID:', promoterId);
    console.log('🔍 Event ID:', eventId);

    setLoading(true);
    try {
      const success = await upgradeToPremium(currentUserId, promoterId || undefined, eventId || undefined);
      
      if (success) {
        console.log('✅ Subscription successful, redirecting to openmessage');
        // Redirect directly to the specific promoter's conversation
        if (eventId) {
          router.push(`/messages/${eventId}/openmessage`);
        } else {
          // Fallback to messages page if no eventId
          router.push('/messages');
        }
      } else {
        console.log('❌ Subscription failed');
        alert('Failed to upgrade subscription. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error upgrading subscription:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  if (!chatStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-heading text-text-primary">GA4U Chat Premium</h1>
      </div>


      {/* Usage Stats */}
      <div className="bg-surface rounded-xl p-4 mb-6 border border-text-secondary">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Your Chat Usage</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">Free chats used:</span>
            <span className="text-text-primary font-semibold">{chatStats.freeChatsUsed}/15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Promoters contacted:</span>
            <span className="text-text-primary font-semibold">{chatStats.totalPromoters}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Free chats remaining:</span>
            <span className="text-text-primary font-semibold">{chatStats.freeChatsRemaining}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-input-background rounded-full h-2">
            <div 
              className="bg-button-red h-2 rounded-full transition-all duration-300"
              style={{ width: `${(chatStats.freeChatsUsed / 15) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">What You Get</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-button-red rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-text-primary">15 free chats with promoters (already used)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-button-red rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-text-primary">Unlimited private chats with all promoters</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-button-red rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-text-primary">Priority support</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-button-red rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-text-primary">Advanced messaging features</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-button-red rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-text-primary">Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-8">
        <div className="w-full border border-button-red bg-surface radius-md p-4 cursor-pointer relative">
          {/* Special Offer Banner */}
          <div className="absolute -top-2 -right-2 bg-button-red text-white text-xs px-2 py-1 rounded-full">
            After Free Trial
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Radio Button */}
              <div className="w-5 h-5 rounded-full border-2 border-button-red bg-button-red mr-3 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Monthly Subscription</p>
                <p className="text-sm text-text-secondary">Unlimited chats with promoters</p>
                <p className="text-sm text-text-secondary">After 15 free chats</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-text-primary">$0/month</p>
              <p className="line-through text-text-secondary text-sm">$10/month</p>
              <p className="text-sm text-text-secondary">Billed monthly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 text-center">
        <p className="text-sm text-text-secondary">
          <span className="line-through text-text-secondary">$10/month</span> <span className="text-text-primary font-semibold">$0/month</span> <span className="text-button-red">(100% OFF first 15 chats)</span>
        </p>
        <p className="text-xs text-text-secondary mt-1">
          After your 15 free chats with promoters
        </p>
      </div>

      {/* Subscribe Button */}
      <button 
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-button-red text-white py-4 radius-md font-semibold hover:bg-button-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </div>
        ) : (
          'Subscribe Now'
        )}
      </button>

      {/* Cancel Anytime */}
      <div className="mt-4 text-center">
        <p className="text-sm text-text-secondary">Cancel anytime • No long-term commitment</p>
      </div>

    </div>
  );
}
