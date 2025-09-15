"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PreviewLicenseContent() {
  const router = useRouter();
  const params = useSearchParams();
  const frontImage = params.get("frontImage") || "";
  const backImage = params.get("backImage") || "";
  const idType = params.get("idType") || "Driver License";
  const country = params.get("country") || "United States";
  const roles = params.get("roles") || "";
  const name = params.get("name") || "User";

  const handleContinue = () => {
    // Here you would typically upload both images to your server
    console.log('Both images confirmed:', { frontImage, backImage });
    // Navigate to review screen
    router.push(`/reviewscreen?name=${encodeURIComponent(name)}&roles=${encodeURIComponent(roles)}`);
  };

  const handleEdit = () => {
    // Go back to front camera
    router.push(`/idcamera?idType=${encodeURIComponent(idType)}&country=${encodeURIComponent(country)}&roles=${encodeURIComponent(roles)}&name=${encodeURIComponent(name)}&side=front`);
  };

  const goBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between">
        <button 
          onClick={goBack}
          className="flex items-center text-black hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-black">
          Preview {idType.toLowerCase()}
        </h1>
        
        <div className="w-6 h-6"></div> {/* Spacer for centering */}
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-gray-100 p-4">
        <div className="max-w-sm mx-auto">
          {/* Front Image */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Front</h3>
            <div className="bg-white rounded-lg p-2 shadow-sm">
              <img 
                src={frontImage} 
                alt="Front of ID" 
                className="w-full h-32 object-cover rounded"
              />
            </div>
          </div>

          {/* Back Image */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Back</h3>
            <div className="bg-white rounded-lg p-2 shadow-sm">
              <img 
                src={backImage} 
                alt="Back of ID" 
                className="w-full h-32 object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white px-4 py-6 border-t border-gray-200">
        <div className="space-y-3">
          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full bg-button-red text-white py-4 rounded-lg font-semibold hover:bg-button-red-hover transition-colors"
          >
            Continue
          </button>
          
          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="w-full bg-gray-200 text-gray-800 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PreviewLicense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <PreviewLicenseContent />
    </Suspense>
  );
}
