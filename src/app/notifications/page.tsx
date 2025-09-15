"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useNotifications } from "../../contexts/NotificationContext";
import Navigation from "../components/Navigation";

interface Notification {
  id: string;
  type: 'first_event' | 'new_message' | 'location_based';
  title: string;
  message: string;
  buttonText: string;
  buttonAction: () => void;
  icon: string;
  timeAgo: string;
  isRead: boolean;
  showConfetti?: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Mark all notifications as read when user visits the page
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Check if user needs verification and show modal
  useEffect(() => {
    const storedUserType = localStorage.getItem('userType');
    const storedTalentCategories = localStorage.getItem('talentCategories');
    const storedVerificationSkipped = localStorage.getItem('verificationSkipped');
    
    if (storedUserType === "talent" && storedTalentCategories) {
      try {
        const categories = JSON.parse(storedTalentCategories);
        const fightingSports = ['Boxer', 'MMA', 'Wrestler'];
        const hasFightingSports = categories.some((cat: string) => fightingSports.includes(cat));
        
        // Show verification modal if user has fighting sports and skipped verification
        if (hasFightingSports && storedVerificationSkipped === 'true') {
          setNeedsVerification(true);
          setShowVerificationModal(true);
        }
      } catch (error) {
        console.error('Error parsing talent categories in NotificationsPage:', error);
      }
    }
  }, []);

  // Handle verification modal
  const handleGetVerified = () => {
    const storedUserType = localStorage.getItem('userType');
    const storedTalentCategories = localStorage.getItem('talentCategories');
    const name = localStorage.getItem('name') || 'User';
    
    // Mark that user took action on the verification modal
    console.log('Notifications: User clicked "Get Verified" - setting verificationModalDismissed = true');
    localStorage.setItem('verificationModalDismissed', 'true');
    
    // Parse talent categories from JSON array to comma-separated string
    let rolesParam = '';
    if (storedTalentCategories) {
      try {
        const categories = JSON.parse(storedTalentCategories);
        rolesParam = categories.join(',');
        console.log('Notifications: Parsed talent categories for verifyid:', categories, '->', rolesParam);
      } catch (error) {
        console.error('Error parsing talent categories in notifications:', error);
        rolesParam = storedTalentCategories; // Fallback to raw string
      }
    }
    
    // Navigate to verifyid page with proper parameters
    router.push(`/verifyid?name=${encodeURIComponent(name)}&roles=${encodeURIComponent(rolesParam)}&country=United States`);
  };

  const handleCloseVerificationModal = () => {
    console.log('Notifications: User clicked "Later" - NOT setting verificationModalDismissed');
    setShowVerificationModal(false);
    // Don't mark as dismissed - user can still see the badge when they leave
    // Only mark as dismissed when they actually click "Get Verified"
  };

  // Trigger confetti animation
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Handle specific actions
    if (notification.type === 'first_event') {
      triggerConfetti();
      router.push('/talentlist');
    } else if (notification.type === 'new_message') {
      router.push('/messages');
    } else if (notification.type === 'location_based') {
      // Store the search term and navigate to map
      if (notification.message.includes('McDonald')) {
        sessionStorage.setItem('mapSearch', 'McDonald\'s breakfast');
      } else if (notification.message.includes('Club Paradise')) {
        sessionStorage.setItem('mapSearch', 'Club Paradise');
      }
      router.push('/map');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      {/* Header - Similar to gigagent4u */}
      <div className="bg-background px-4 py-4">
        <div className="flex items-center space-x-3">
          {/* Profile Picture */}
          <div className="w-10 h-10 rounded-full bg-input-background flex items-center justify-center relative">
            <svg className="w-6 h-6 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 bg-input-background rounded-lg px-4 py-3 flex items-center space-x-3">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-text-secondary">Search notifications</span>
          </div>

          {/* Menu Button */}
          <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 px-4 py-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-blue-50 rounded-xl p-4 mb-4 transition-all duration-200 ${
              !notification.isRead ? 'border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Notification Icon */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg">
                  {notification.icon}
                </div>
              </div>

              {/* Notification Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
                      {notification.title}
                    </h3>
                    <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  
                  {/* Time and Menu */}
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    <span className="text-xs text-gray-500">{notification.timeAgo}</span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full"
                >
                  {notification.buttonText}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state if no notifications */}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500 text-center">You'll see updates about events, messages, and nearby activities here.</p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <Navigation />

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleCloseVerificationModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center">Verification Required</h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-center leading-relaxed mb-6">
                As a professional athlete in combat sports (Boxer, MMA, or Wrestler), you are required to have a valid athletic license to participate in events and competitions on our platform.
              </p>
              <p className="text-gray-600 text-center leading-relaxed mb-6">
                Please complete your verification to access all features and opportunities available to you.
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex border-t border-gray-200">
              <button 
                onClick={handleCloseVerificationModal}
                className="flex-1 py-4 px-6 text-gray-600 font-semibold hover:bg-gray-50 transition-colors border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Later
              </button>
              <button 
                onClick={handleGetVerified}
                className="flex-1 py-4 px-6 bg-button-red text-white font-semibold hover:bg-button-red-hover transition-colors focus:outline-none focus:ring-2 focus:ring-button-red"
              >
                Get Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}