"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface GoalSectionProps {
  userType: string;
}

export default function GoalSection({ userType }: GoalSectionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [firstEventPosted, setFirstEventPosted] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [talentInvited, setTalentInvited] = useState(false);
  const [, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  // Get current user and load user-specific goals
  useEffect(() => {
    const loadUserGoals = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("No authenticated user:", authError);
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);

        // Load user's goal progress from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError);
          setLoading(false);
          return;
        }

        if (profile) {
          // Store profile data for progress calculation
          setProfileData(profile);
          
          // Check profile completion based on user data
          // For talent users, check all required fields
          if (userType === "talent") {
            const hasName = profile.full_name && profile.full_name.trim() !== '';
            const hasBio = profile.bio && profile.bio.trim() !== '';
            const hasPhone = profile.phone_number && profile.phone_number.trim() !== '';
            const hasHeight = profile.height && profile.height.trim() !== '';
            const hasWeight = profile.weight && profile.weight.trim() !== '';
            const hasLocation = profile.location && profile.location.trim() !== '';
            
            // Check if user has at least one weight class (boxing or MMA)
            const hasWeightClass = (profile.boxing_weight_class && profile.boxing_weight_class.trim() !== '') || 
                                 (profile.mma_weight_class && profile.mma_weight_class.trim() !== '');
            
            // Check if user has at least one achievement
            const hasAchievements = profile.achievements && profile.achievements.length > 0 && 
                                  profile.achievements.some(achievement => achievement && achievement.trim() !== '');
            
            // Check if user has at least one social link
            const hasSocialLinks = profile.social_links && profile.social_links.length > 0 && 
                                 profile.social_links.some(link => link && link.trim() !== '');
            
            // Count completed fields (9 total fields)
            const completedFields = [
              hasName, hasBio, hasPhone, hasHeight, hasWeight, 
              hasLocation, hasWeightClass, hasAchievements, hasSocialLinks
            ].filter(Boolean).length;
            
            // Profile is complete when all 9 fields are filled
            const isComplete = completedFields === 9;
            
            setProfileCompleted(isComplete);
          } else {
            // For promoters, keep the existing logic
            const hasName = profile.full_name && profile.full_name.trim() !== '';
            const hasBio = profile.bio && profile.bio.trim() !== '';
            setProfileCompleted(hasName && hasBio);
          }

          // Check if user has posted events (for promoters)
          if (userType === "promoter") {
            const { data: posts, error: postsError } = await supabase
              .from('posts')
              .select('id')
              .eq('promoter_id', user.id)
              .limit(1);

            if (!postsError && posts && posts.length > 0) {
              setFirstEventPosted(true);
            }

            // Check if user has accepted talents
            const acceptedTalents = profile.accepted_talents || [];
            setTalentInvited(acceptedTalents.length > 0);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading user goals:', error);
        setLoading(false);
      }
    };

    loadUserGoals();

    // Listen for custom events to refresh goals
    const handleGoalUpdate = () => {
      loadUserGoals();
    };

    window.addEventListener('profileSaved', handleGoalUpdate);
    window.addEventListener('talentInvited', handleGoalUpdate);
    window.addEventListener('talentAccepted', handleGoalUpdate);
    window.addEventListener('postCreated', handleGoalUpdate);

    return () => {
      window.removeEventListener('profileSaved', handleGoalUpdate);
      window.removeEventListener('talentInvited', handleGoalUpdate);
      window.removeEventListener('talentAccepted', handleGoalUpdate);
      window.removeEventListener('postCreated', handleGoalUpdate);
    };
  }, [userType]);

  // Trigger confetti when all promoter goals are completed
  useEffect(() => {
    if (userType === "promoter" && profileCompleted && firstEventPosted && talentInvited) {
      // Trigger confetti effect
      const triggerConfetti = () => {
        // Create confetti particles
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        const confettiCount = 150;
        
        for (let i = 0; i < confettiCount; i++) {
          setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
            
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
              if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
              }
            }, 5000);
          }, i * 10);
        }
      };

      // Add CSS animation for confetti
      if (!document.getElementById('confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        style.textContent = `
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      triggerConfetti();
    }
  }, [userType, profileCompleted, firstEventPosted, talentInvited]);

  if (!isVisible || loading) return null;

  // Calculate progress based on user type
  let progress = 0;
  let completeProfileProgress = 0;
  let uploadEventProgress = 0;
  let inviteTalentProgress = 0;
  let applyForJobProgress = 0;

  if (userType === "promoter") {
    // For promoters: Complete profile (33%), Upload event (33%), Invite talent (33%)
    completeProfileProgress = profileCompleted ? 100 : 0;
    uploadEventProgress = firstEventPosted ? 100 : 0;
    inviteTalentProgress = talentInvited ? 100 : 0;
    
    // Calculate total progress (3 goals total)
    const completedGoals = (profileCompleted ? 1 : 0) + (firstEventPosted ? 1 : 0) + (talentInvited ? 1 : 0);
    progress = Math.round((completedGoals / 3) * 100);
  } else {
    // For talents: Complete profile (50%), Apply for job (50%) - 2 goals total
    completeProfileProgress = profileCompleted ? 100 : 0;
    applyForJobProgress = 0; // Always 0 for now
    
    // Calculate total progress (2 goals total)
    const completedGoals = (profileCompleted ? 1 : 0) + (applyForJobProgress === 100 ? 1 : 0);
    progress = Math.round((completedGoals / 2) * 100);
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
        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
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
              <span className="text-white text-sm">Accept talent</span>
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
            <div className="flex items-center space-x-2">
              {applyForJobProgress === 100 && (
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-white text-sm font-semibold">{applyForJobProgress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
