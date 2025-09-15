"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "../components/Navigation";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export default function ProfilePage() {
  const router = useRouter();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Detect device type
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Handle profile picture zoom
  const handleProfilePictureClick = () => {
    if (profileImage) {
      setZoomOpen(true);
    }
  };


  // Detect social media platform from URL
  const getSocialPlatform = (url: string) => {
    if (url.includes('instagram.com')) return { platform: 'Instagram', logo: '/instagram.png' };
    if (url.includes('linkedin.com')) return { platform: 'LinkedIn', logo: '/linkedin.png' };
    if (url.includes('facebook.com')) return { platform: 'Facebook', logo: '/facebook.png' };
    if (url.includes('twitter.com') || url.includes('x.com')) return { platform: 'X', logo: '/X.png' };
    if (url.includes('youtube.com')) return { platform: 'YouTube', logo: '/Youtube.png' };
    return { platform: 'Social', logo: '/globe.svg' };
  };

  // Handle social link click with custom popup
  const handleSocialClick = (url: string) => {
    setPendingUrl(url);
    setShowLeaveWarning(true);
  };

  // Handle popup confirmation
  const handleLeaveConfirm = () => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    }
    setShowLeaveWarning(false);
    setPendingUrl(null);
  };

  // Handle popup cancellation
  const handleLeaveCancel = () => {
    setShowLeaveWarning(false);
    setPendingUrl(null);
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showLeaveWarning) {
        handleLeaveCancel();
      }
    };

    if (showLeaveWarning) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showLeaveWarning]);

  // Check if verification is needed
  useEffect(() => {
    const storedUserType = localStorage.getItem('userType');
    const storedTalentCategories = localStorage.getItem('talentCategories');
    const storedVerificationSkipped = localStorage.getItem('verificationSkipped');
    
    if (storedUserType === "talent" && storedTalentCategories) {
      try {
        const categories = JSON.parse(storedTalentCategories);
        const fightingSports = ['Boxer', 'MMA', 'Wrestler'];
        const hasFightingSports = categories.some((cat: string) => fightingSports.includes(cat));
        
        // Show verification warning if user has fighting sports and skipped verification
        if (hasFightingSports && storedVerificationSkipped === 'true') {
          setNeedsVerification(true);
          console.log('Profile: Fighting sports talent skipped verification - showing verification warning');
        } else {
          setNeedsVerification(false);
          console.log('Profile: No verification warning needed', { hasFightingSports, storedVerificationSkipped });
        }
      } catch (error) {
        console.error('Error parsing talent categories:', error);
      }
    }
  }, []);

  // Check if a category is a fighting sport
  const isFightingSport = (category: string) => {
    const fightingSports = ['MMA', 'Boxer', 'Wrestler'];
    return fightingSports.includes(category);
  };

  // Get weight class information for fighting sports
  const getWeightClassInfo = () => {
    const fightingCategories = talentCategories.filter(isFightingSport);
    if (fightingCategories.length > 0) {
      // Check if user has both Boxing and MMA selected
      const hasBoxing = talentCategories.includes('Boxer');
      const hasMMA = talentCategories.includes('MMA');
      const hasBothSports = hasBoxing && hasMMA;
      
      // Check if user has weight class data (boxing or MMA)
      if (userData.boxingWeightClass || userData.mmaWeightClass) {
        let weightClassDisplay = "";
        
        // If user has both sports selected, show both weight classes with parentheses
        if (hasBothSports) {
          const weightClasses = [];
          if (userData.boxingWeightClass) {
            weightClasses.push(`${userData.boxingWeightClass} (Boxing)`);
          }
          if (userData.mmaWeightClass) {
            weightClasses.push(`${userData.mmaWeightClass} (MMA)`);
          }
          weightClassDisplay = weightClasses.join(" • ");
        } else {
          // If only one sport, show without parentheses
          weightClassDisplay = userData.boxingWeightClass || userData.mmaWeightClass;
        }
        
        return {
          weightClass: weightClassDisplay,
          height: userData.height,
          weight: userData.weight
        };
      }
      // Fallback to mock data for other fighting sports
      return {
        weightClass: "Light Flyweight",
        height: "5'2\"",
        weight: "106lbs"
      };
    }
    return null;
  };

  // User data state - loads from localStorage
  const [userData, setUserData] = useState({
    fullName: "Ryusuke",
    userType: "Promoter", // or specific talent category
    hasBusinessLicense: true,
    reviews: 0,
    rating: "0.00",
    bio: "Professional event promoter with 5+ years of experience in organizing memorable events.",
    achievements: [],
    socialLinks: [],
    reviewComments: [],
    boxingWeightClass: "",
    mmaWeightClass: "",
    height: "",
    weight: ""
  });

  // Get user type and talent categories from localStorage
  const [userType, setUserType] = useState<string>("promoter");
  const [talentCategories, setTalentCategories] = useState<string[]>([]);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    console.log('🔍 AUDIT: Raw localStorage data:', savedProfile);
    if (savedProfile) {
      const parsedData = JSON.parse(savedProfile);
      console.log('🔍 AUDIT: Parsed achievements:', parsedData.achievements);
      console.log('🔍 AUDIT: Achievements type:', typeof parsedData.achievements);
      console.log('🔍 AUDIT: Achievements length:', parsedData.achievements?.length);
      console.log('🔍 AUDIT: Is array?', Array.isArray(parsedData.achievements));
      
      setUserData(prev => ({
        ...prev,
        fullName: parsedData.fullName || prev.fullName,
        bio: parsedData.bio || prev.bio,
        achievements: parsedData.achievements !== undefined ? parsedData.achievements : prev.achievements,
        socialLinks: parsedData.socialLinks !== undefined ? parsedData.socialLinks : prev.socialLinks,
        boxingWeightClass: parsedData.boxingWeightClass || "",
        mmaWeightClass: parsedData.mmaWeightClass || "",
        height: parsedData.height || "",
        weight: parsedData.weight || ""
      }));
      
      console.log('🔍 AUDIT: Final achievements after setUserData:', parsedData.achievements !== undefined ? parsedData.achievements : []);
      if (parsedData.profileImage) {
        setProfileImage(parsedData.profileImage);
      }
    }

    // Load user type and talent categories
    const storedUserType = localStorage.getItem('userType');
    if (storedUserType) {
      setUserType(storedUserType);
    }

    // Load talent categories from localStorage
    const storedTalentCategories = localStorage.getItem('talentCategories');
    if (storedTalentCategories) {
      try {
        const categories = JSON.parse(storedTalentCategories);
        setTalentCategories(categories);
      } catch (error) {
        console.error('Error parsing talent categories:', error);
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      {/* Header with Background Pattern */}
      <div className="relative">
        {/* Background with geometric pattern */}
        <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
          {/* Geometric pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-8 w-6 h-6 bg-white rounded-full"></div>
            <div className="absolute top-12 left-16 w-4 h-4 bg-gray-300 rounded"></div>
            <div className="absolute top-20 right-12 w-8 h-8 bg-white rounded-full"></div>
            <div className="absolute top-32 left-24 w-5 h-5 bg-gray-300 rounded"></div>
            <div className="absolute top-16 right-24 w-6 h-6 bg-white rounded"></div>
            <div className="absolute top-8 right-8 w-4 h-4 bg-gray-300 rounded-full"></div>
          </div>
          

          {/* Edit Button */}
          <button 
            onClick={() => router.push('/editprofile')}
            className="absolute top-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-gray-100 hover:shadow-xl transition-all duration-200 border border-gray-200"
          >
            Edit Profile
          </button>
        </div>

        {/* Profile Picture */}
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
          <div 
            className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfilePictureClick}
          >
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white pt-16 px-6">
        {/* User Name */}
        <h1 className="text-2xl font-bold text-center text-black mb-2">{userData.fullName}</h1>

        {/* Verification Status Container */}
        {needsVerification && (
          <div className="bg-gray-100 border-2 border-red-500 rounded-lg p-3 mb-4 mx-auto max-w-xs">
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-red-600 font-medium text-sm">Need verification</span>
            </div>
          </div>
        )}

        {/* User Type / Talent Categories */}
        {userType === "promoter" ? (
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-black rounded-sm mr-2"></div>
            <span className="text-black font-medium">Promoter</span>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-2">
            {/* Talent Category Chips */}
            {talentCategories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                {talentCategories.map((category, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-black px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            
            {/* Weight Class Info for Fighting Sports */}
            {getWeightClassInfo() && (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">
                  {getWeightClassInfo()?.weightClass} fighter
                </div>
                <div className="text-xs text-gray-500">
                  Height: {getWeightClassInfo()?.height} • Weight: {getWeightClassInfo()?.weight}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        <div className="text-center mb-6 px-4">
          <p className="text-sm text-gray-600 leading-relaxed">{userData.bio}</p>
        </div>

        {/* Business License Status - Only for Promoters */}
        {userType === "promoter" && (
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 text-sm font-medium">
                Business license certified
              </span>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="flex justify-center space-x-12 mb-8">
          <div className="text-center">
            <div className="text-xl font-bold text-black">{userData.reviews}</div>
            <div className="text-sm text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-xl font-bold text-black">
              {userData.rating}
              <svg className="w-4 h-4 ml-1 fill-black" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">ratings</div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 mb-6"></div>

        {/* Achievements Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4 text-center">Achievements</h2>
          <div className="grid grid-cols-2 gap-6 max-w-xs mx-auto">
            {(() => {
              console.log('🔍 AUDIT: Rendering check - achievements length:', userData.achievements.length);
              console.log('🔍 AUDIT: Rendering check - achievements data:', userData.achievements);
              console.log('🔍 AUDIT: Rendering check - will show achievements?', userData.achievements.length > 0);
              return userData.achievements.length > 0;
            })() ? (
              userData.achievements.map((achievement, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="text-sm text-black">{achievement}</div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl text-white">+</span>
                </div>
                <div className="text-sm text-gray-500">No achievements yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Social Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4 text-center">Social</h2>
          <div className="grid grid-cols-2 gap-6 max-w-xs mx-auto">
            {userData.socialLinks.filter(link => link && link.trim() !== "").length > 0 ? (
              userData.socialLinks
                .filter(link => link && link.trim() !== "")
                .map((link, index) => {
                  const { platform, logo } = getSocialPlatform(link);
                  return (
                    <div key={index} className="text-center">
                      <div 
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-2 mx-auto cursor-pointer hover:from-blue-600 hover:to-blue-800 transition-all"
                        onClick={() => handleSocialClick(link)}
                      >
                        <img 
                          src={logo} 
                          alt={platform}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <div className="text-sm text-black">{platform}</div>
                    </div>
                  );
                })
            ) : (
              <div className="col-span-2 text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl text-white">+</span>
                </div>
                <div className="text-sm text-gray-500">No social links yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4 text-center">0 reviews</h2>
          <div className="space-y-4">
            {userData.reviewComments.length > 0 ? (
              <>
                {/* Show first 5 reviews, or all if expanded */}
                {(showAllReviews ? userData.reviewComments : userData.reviewComments.slice(0, 5)).map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg">{review.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-black">{review.name}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{review.talentCategory}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{review.date}</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* See More/Less Button */}
                {userData.reviewComments.length > 5 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      {showAllReviews ? 'See Less' : 'See More'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-lg font-medium text-gray-500 mb-2">No reviews yet</div>
                <div className="text-sm text-gray-400">Reviews will appear here once you start getting feedback from talents</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Nav */}
      <Navigation />

      {/* Profile Picture Zoom Dialog */}
      <Dialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setZoomOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          {profileImage && (
            <img
              src={profileImage}
              alt="Profile Zoom"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Leave Warning Popup */}
      {showLeaveWarning && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleLeaveCancel();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                Leave GigAgent4U?
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-center leading-relaxed">
                You are about to leave GigAgent4U. Do you want to continue?
              </p>
            </div>
            
            {/* Footer */}
            <div className="flex border-t border-gray-200">
              <button
                onClick={handleLeaveCancel}
                className="flex-1 py-4 px-6 text-gray-600 font-semibold hover:bg-gray-50 transition-colors border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="flex-1 py-4 px-6 bg-button-red text-white font-semibold hover:bg-button-red-hover transition-colors focus:outline-none focus:ring-2 focus:ring-button-red"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
