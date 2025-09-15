"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

function ReviewScreenContent() {
  const params = useSearchParams();
  const name = params.get("name") || "User";
  const roles = params.get("roles") || "";
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCompleteSetup = () => {
    // Clear verification flags since user completed verification
    localStorage.setItem('verificationSkipped', 'false');
    localStorage.setItem('verificationModalDismissed', 'true');
    
    // Determine the primary role for location page
    let primaryRole = "Talent"; // Default
    
    if (roles) {
      const roleList = roles.split(",").filter(role => role.trim() !== "");
      if (roleList.includes("Promoter")) {
        primaryRole = "Promoter";
      } else if (roleList.length > 0) {
        // If it's a specific talent category, still use "Talent"
        primaryRole = "Talent";
      }
    }
    
    console.log('Setup completed for:', name, 'with roles:', roles, 'primary role:', primaryRole);
    // Navigate to location page with role information
    window.location.href = `/location?role=${encodeURIComponent(primaryRole)}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* GA4U Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center">
            <Image 
              src="/GA4U.png" 
              alt="GA4U Logo" 
              width={60} 
              height={60}
              className="object-contain"
            />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Welcome, {name}
          </h1>
          <p className="text-text-secondary">
            Here&apos;s what we need to complete your account setup.
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-surface rounded-lg shadow-sm border border-text-secondary overflow-hidden">
          {/* Card Header */}
          <div 
            className="px-4 py-3 cursor-pointer hover:bg-input-background transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between min-h-[48px]">
              <div className="flex items-center flex-shrink-0">
                {/* Verification Icon */}
                <div className="w-8 h-8 bg-button-red opacity-20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-button-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-text-primary font-medium text-sm sm:text-base truncate">Verify your Identity</span>
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {/* Under Review Badge */}
                <span className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                  Under Review
                </span>
                {/* Clock Icon */}
                <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {/* Expand/Collapse Icon */}
                <svg 
                  className={`w-5 h-5 text-text-secondary transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Expandable Content */}
          {isExpanded && (
            <div className="px-4 pb-4 border-t border-text-secondary">
              <div className="pt-4">
                <p className="text-text-secondary text-sm leading-relaxed">
                  We are reviewing your identity information. Please allow up to two (2) business days for verification. 
                  We will send you an email after the review is complete.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Complete Setup Button */}
        <div className="mt-8">
          <button
            onClick={handleCompleteSetup}
            className="w-full bg-button-red text-white py-4 rounded-lg font-semibold hover:bg-button-red-hover transition-colors"
          >
            Complete setup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-900">Loading...</div></div>}>
      <ReviewScreenContent />
    </Suspense>
  );
}
