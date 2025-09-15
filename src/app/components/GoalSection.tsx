"use client";

import { useState, useEffect } from "react";

interface GoalSectionProps {
  userType: string;
}

export default function GoalSection({ userType }: GoalSectionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [firstEventPosted, setFirstEventPosted] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [talentInvited, setTalentInvited] = useState(false);

  useEffect(() => {
    // Check if first event has been posted
    const posted = sessionStorage.getItem('firstEventPosted');
    if (posted === 'true') {
      setFirstEventPosted(true);
    }

    // Check if profile is completed (for both talent and promoter users)
    const checkProfileCompletion = () => {
      const savedProfile = localStorage.getItem('savedProfile');
      if (savedProfile) {
        try {
          const profileData = JSON.parse(savedProfile);
          
          if (userType === "talent") {
            // For talents: Check if essential fields are filled (excluding rating and comments)
            const hasName = profileData.fullName && profileData.fullName.trim() !== '';
            const hasBio = profileData.bio && profileData.bio.trim() !== '';
            
            // Profile is complete if at least name and bio are filled
            if (hasName && hasBio) {
              setProfileCompleted(true);
            } else {
              setProfileCompleted(false);
            }
          } else if (userType === "promoter") {
            // For promoters: Check if essential fields are filled (excluding rating and comments)
            const hasName = profileData.fullName && profileData.fullName.trim() !== '';
            const hasBio = profileData.bio && profileData.bio.trim() !== '';
            
            // Profile is complete if at least name and bio are filled
            if (hasName && hasBio) {
              setProfileCompleted(true);
            } else {
              setProfileCompleted(false);
            }
          }
        } catch (error) {
          console.error('Error parsing saved profile:', error);
          setProfileCompleted(false);
        }
      } else {
        setProfileCompleted(false);
      }
    };

    // Check if talent has been invited (for promoter users)
    const checkTalentInvitation = () => {
      if (userType === "promoter") {
        const invitedTalents = localStorage.getItem('invitedTalents');
        if (invitedTalents) {
          try {
            const talents = JSON.parse(invitedTalents);
            setTalentInvited(talents.length > 0);
          } catch (error) {
            console.error('Error parsing invited talents:', error);
            setTalentInvited(false);
          }
        } else {
          setTalentInvited(false);
        }
      }
    };

    checkProfileCompletion();
    checkTalentInvitation();

    // Listen for changes to localStorage
    const handleStorageChange = () => {
      checkProfileCompletion();
      checkTalentInvitation();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when profile is saved from same tab
    window.addEventListener('profileSaved', handleStorageChange);
    
    // Listen for talent invitation events
    window.addEventListener('talentInvited', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileSaved', handleStorageChange);
      window.removeEventListener('talentInvited', handleStorageChange);
    };
  }, [userType]);

  if (!isVisible) return null;

  // Calculate progress based on user type
  let progress = 0;
  let completeProfileProgress = 0;
  let uploadEventProgress = 0;
  let inviteTalentProgress = 0;

  if (userType === "promoter") {
    // For promoters: Complete profile (33%), Upload event (33%), Invite talent (33%)
    completeProfileProgress = profileCompleted ? 100 : 0;
    uploadEventProgress = firstEventPosted ? 100 : 0;
    inviteTalentProgress = talentInvited ? 100 : 0;
    
    // Calculate total progress (3 goals total)
    const completedGoals = (profileCompleted ? 1 : 0) + (firstEventPosted ? 1 : 0) + (talentInvited ? 1 : 0);
    progress = Math.round((completedGoals / 3) * 100);
  } else {
    // For talents: Complete profile (50%), Apply for job (50%)
    completeProfileProgress = profileCompleted ? 100 : 0;
    progress = profileCompleted ? 50 : 0; // 1 out of 2 goals
  }

  return (
    <div className="bg-black rounded-xl mx-4 mb-6 p-4 relative">
      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-white hover:text-text-secondary transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Title */}
      <h2 className="text-white font-bold text-lg mb-3">
        Your goals is {progress}% complete
      </h2>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Description */}
      <p className="text-white text-sm mb-4">
        Complete the steps below to finish your profile and unlock your next goals.
      </p>

      {/* Goal List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-white text-sm">Complete your profile</span>
          <div className="flex items-center space-x-2">
            {completeProfileProgress === 100 && (
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-white text-sm font-semibold">{completeProfileProgress}%</span>
          </div>
        </div>
        {userType === "promoter" ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-white text-sm">Upload an event</span>
              <div className="flex items-center space-x-2">
                {uploadEventProgress === 100 && (
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-white text-sm font-semibold">{uploadEventProgress}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white text-sm">Invite talent</span>
              <div className="flex items-center space-x-2">
                {inviteTalentProgress === 100 && (
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-white text-sm font-semibold">{inviteTalentProgress}%</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-white text-sm">Apply for job</span>
            <span className="text-white text-sm font-semibold">0%</span>
          </div>
        )}
      </div>
    </div>
  );
}
