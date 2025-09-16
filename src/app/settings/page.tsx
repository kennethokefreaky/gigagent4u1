"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";
import Navigation from "../components/Navigation";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import WarningIcon from "@mui/icons-material/Warning";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";

export default function SettingsPage() {
  const router = useRouter();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [contactUsModalOpen, setContactUsModalOpen] = useState(false);
  const [userType, setUserType] = useState<string>("promoter");
  const [talentCategories, setTalentCategories] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string>("needs_attention"); // "approved" or "needs_attention"
  const [verificationLabel, setVerificationLabel] = useState<string>("Business Verification");
  
  // Feedback form state
  const [feedbackText, setFeedbackText] = useState("");
  const [satisfactionRating, setSatisfactionRating] = useState<number | null>(null);
  const isKeyboardVisible = useKeyboardVisibility();


  // Single useEffect to handle all initialization and verification logic
  useEffect(() => {
    const storedUserType = localStorage.getItem('userType');
    const storedTalentCategories = localStorage.getItem('talentCategories');
    const storedVerificationSkipped = localStorage.getItem('verificationSkipped');
    
    console.log('Settings useEffect - Raw data:', {
      storedUserType,
      storedTalentCategories,
      storedVerificationSkipped
    });
    
    // Set user type
    if (storedUserType) {
      setUserType(storedUserType);
    }
    
    // Set talent categories
    if (storedTalentCategories) {
      try {
        const categories = JSON.parse(storedTalentCategories);
        setTalentCategories(categories);
        console.log('Settings useEffect - Parsed categories:', categories);
      } catch (error) {
        console.error('Error parsing talent categories:', error);
      }
    }
    
    // Determine verification label and status
    if (storedUserType === "talent" && storedTalentCategories) {
      const fightingSports = ['Boxer', 'MMA', 'Wrestler'];
      
      try {
        const parsedCategories = JSON.parse(storedTalentCategories);
        const hasFightingSports = parsedCategories.some((cat: string) => fightingSports.includes(cat));
        
        console.log('Settings useEffect - Fighting sports check:', {
          hasFightingSports,
          parsedCategories,
          storedVerificationSkipped
        });
        
        if (hasFightingSports) {
          setVerificationLabel("Athletic License");
          
          if (storedVerificationSkipped === 'true') {
            setVerificationStatus("needs_attention");
            console.log('Settings: Fighting sports talent skipped verification - setting needs_attention');
          } else {
            setVerificationStatus("approved");
            console.log('Settings: Fighting sports talent completed verification - setting approved');
          }
        } else {
          setVerificationLabel("ID Verification");
          setVerificationStatus("approved");
          console.log('Settings: Non-fighting sports talent - setting approved');
        }
      } catch (error) {
        console.error('Error parsing talent categories in verification logic:', error);
      }
    } else if (storedUserType === "promoter") {
      setVerificationLabel("Business Verification");
      setVerificationStatus("approved");
      console.log('Settings: Promoter - setting approved');
    }
  }, []); // Run only once on mount

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut(); // ✅ logs out from Supabase
      if (error) {
        console.error("Error during logout:", error.message);
      } else {
        console.log("User logged out successfully");
      }
    } catch (err) {
      console.error("Unexpected logout error:", err);
    } finally {
      setLogoutModalOpen(false);
      router.push("/splash"); // ✅ redirect back to splash page
    }
  };

  const handleStay = () => {
    setLogoutModalOpen(false);
  };

  const handleCloseContactUs = () => {
    setContactUsModalOpen(false);
    setFeedbackText("");
    setSatisfactionRating(null);
  };

  const handleSubmitFeedback = () => {
    if (!satisfactionRating) {
      alert("Please rate your experience");
      return;
    }
    
    // Here you would typically send the feedback to your backend
    console.log("Feedback submitted:", {
      rating: satisfactionRating,
      text: feedbackText,
      userType: userType
    });
    
    alert("Thank you for your feedback!");
    handleCloseContactUs();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="px-6 py-6 bg-gray-900">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {/* Dynamic Verification Row */}
          <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <BadgeIcon className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">{verificationLabel}</h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {verificationStatus === "approved" ? (
                <>
                  <span className="text-green-400 text-sm font-medium">Approved</span>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="text-white text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <span className="text-red-400 text-sm font-medium">Needs Attention</span>
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <WarningIcon className="text-white text-xs" style={{ fontSize: '14px' }} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact Us Row */}
          <div 
            className="bg-gray-800 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors"
            onClick={() => setContactUsModalOpen(true)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <ContactSupportIcon className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Contact Us</h3>
              </div>
            </div>
          </div>

          {/* Logout Row */}
          <div 
            className="bg-gray-800 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors"
            onClick={() => setLogoutModalOpen(true)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <LogoutIcon className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Logout</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Bottomsheet */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleStay}
          />
          
          {/* Modal Content */}
          <div className="relative bg-gray-800 rounded-t-2xl w-full max-w-md mx-4 mb-4">
            <div className="p-6 space-y-4">
              <h3 className="text-white text-lg font-semibold text-center">Are you sure you want to logout?</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white py-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
                
                <button
                  onClick={handleStay}
                  className="w-full bg-gray-600 text-white py-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Stay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Us Feedback Modal */}
      {contactUsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCloseContactUs}
          />
          
          {/* Modal Content */}
          <div className="relative bg-gray-800 rounded-t-2xl w-full max-w-md mx-4 mb-4 bottom-sheet-with-textarea">
            <div className="p-6 space-y-6">
              <h3 className="text-white text-lg font-semibold text-center">Send Feedback</h3>
              
              {/* Satisfaction Rating Section */}
              <div className="space-y-4">
                <p className="text-white text-sm text-center">
                  Please rate your satisfaction with the following parameters based on your recent experience with our platform.
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm">Ease of using the platform</span>
                  </div>
                  
                  {/* Rating Options */}
                  <div className="flex justify-between items-center">
                    {[
                      { value: 1, label: "Very Dissatisfied" },
                      { value: 2, label: "Dissatisfied" },
                      { value: 3, label: "Neutral" },
                      { value: 4, label: "Satisfied" },
                      { value: 5, label: "Very Satisfied" }
                    ].map((option) => (
                      <div key={option.value} className="flex flex-col items-center space-y-2">
                        <span className="text-white text-xs text-center leading-tight">
                          {option.label}
                        </span>
                        <input
                          type="radio"
                          name="satisfaction"
                          value={option.value}
                          checked={satisfactionRating === option.value}
                          onChange={(e) => setSatisfactionRating(parseInt(e.target.value))}
                          className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 focus:ring-red-500 focus:ring-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Feedback Text Area */}
              <div className="space-y-2">
                <label className="block text-white text-sm font-medium">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-white placeholder-gray-400 bg-gray-700"
                  rows={4}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSubmitFeedback}
                  className="w-full bg-red-600 text-white py-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Send Feedback
                </button>
                
                <button
                  onClick={handleCloseContactUs}
                  className="w-full bg-gray-600 text-white py-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <Navigation />
    </div>
  );
}
