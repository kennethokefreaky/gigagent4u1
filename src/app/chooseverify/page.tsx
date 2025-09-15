"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ChooseVerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const idType = params.get("idType") || "ID";
  const country = params.get("country") || "United States";
  const roles = params.get("roles") || "";
  const name = params.get("name") || "User";

  const handleUploadPhoto = () => {
    if (idType === "Driver License") {
      // For driver license, allow exactly two files
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          // Algorithm to ensure exactly two photos
          if (files.length === 2) {
            // Perfect - exactly two files selected
            console.log('Driver License - Two files uploaded:', files);
            // Convert files to base64 and store in sessionStorage
            const file1 = files[0];
            const file2 = files[1];
            
            const reader1 = new FileReader();
            reader1.onload = () => {
              const reader2 = new FileReader();
              reader2.onload = () => {
                // Store both images in sessionStorage
                sessionStorage.setItem('driverLicenseFrontImage', reader1.result as string);
                sessionStorage.setItem('driverLicenseBackImage', reader2.result as string);
                console.log('Driver License - Stored both uploaded images in sessionStorage');
                router.push(`/reviewscreen?name=${encodeURIComponent(name)}&roles=${encodeURIComponent(roles)}`);
              };
              reader2.readAsDataURL(file2);
            };
            reader1.readAsDataURL(file1);
          } else if (files.length > 2) {
            // Too many files - take only the first two
            const selectedFiles = Array.from(files).slice(0, 2);
            console.log('Driver License - Too many files, using first two:', selectedFiles);
            // Convert first two files to base64 and store in sessionStorage
            const file1 = selectedFiles[0];
            const file2 = selectedFiles[1];
            
            const reader1 = new FileReader();
            reader1.onload = () => {
              const reader2 = new FileReader();
              reader2.onload = () => {
                // Store both images in sessionStorage
                sessionStorage.setItem('driverLicenseFrontImage', reader1.result as string);
                sessionStorage.setItem('driverLicenseBackImage', reader2.result as string);
                console.log('Driver License - Stored first two uploaded images in sessionStorage');
                router.push(`/reviewscreen?name=${encodeURIComponent(name)}&roles=${encodeURIComponent(roles)}`);
              };
              reader2.readAsDataURL(file2);
            };
            reader1.readAsDataURL(file1);
          } else {
            // Less than two files - prompt to select more
            const remainingFiles = 2 - files.length;
            alert(`Please select ${remainingFiles} more image${remainingFiles > 1 ? 's' : ''} to complete your driver license upload.`);
            // Re-trigger the file selection
            input.click();
          }
        }
      };
      input.click();
    } else {
      // For other IDs, single file upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Handle the uploaded file (you can process it here)
          console.log('File uploaded:', file);
          // Go to review screen
          router.push(`/reviewscreen?name=${encodeURIComponent(name)}`);
        }
      };
      input.click();
    }
  };

  const handleTakePhoto = () => {
    // For driver license, start with front side
    if (idType === "Driver License") {
      router.push(`/idcamera?idType=${encodeURIComponent(idType)}&country=${encodeURIComponent(country)}&roles=${encodeURIComponent(roles)}&name=${encodeURIComponent(name)}&side=front`);
    } else {
      // For other IDs, no side parameter needed
      router.push(`/idcamera?idType=${encodeURIComponent(idType)}&country=${encodeURIComponent(country)}&roles=${encodeURIComponent(roles)}&name=${encodeURIComponent(name)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back button */}
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Main heading */}
        <h1 className="text-heading text-text-primary mb-6 text-center">
          Make a choice
        </h1>

        {/* ID Type Display */}
        <div className="mb-8 text-center">
          <p className="text-body text-text-secondary">
            {idType === "Driver License" ? (
              <>
                Upload both front and back of your{" "}
                <span className="text-text-primary font-semibold">{idType}</span>
              </>
            ) : (
              <>
                Upload your <span className="text-text-primary font-semibold">{idType}</span>
              </>
            )}
          </p>
        </div>

        {/* Choice Buttons */}
        <div className="space-y-4 mb-8">
          {/* Upload Photo Button */}
          <button
            onClick={handleUploadPhoto}
            className="w-full flex items-center justify-center px-4 py-4 radius-md bg-input-background hover:bg-surface text-left border border-text-secondary hover:border-button-red transition-colors"
          >
            <div className="flex items-center">
              {/* Upload Icon */}
              <div className="w-8 h-8 bg-button-red opacity-20 radius-md flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-button-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="text-text-primary text-body font-medium">Upload a photo</span>
            </div>
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Take Photo Button */}
          <button
            onClick={handleTakePhoto}
            className="w-full flex items-center justify-center px-4 py-4 radius-md bg-input-background hover:bg-surface text-left border border-text-secondary hover:border-button-red transition-colors"
          >
            <div className="flex items-center">
              {/* Camera Icon */}
              <div className="w-8 h-8 bg-button-red opacity-20 radius-md flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-button-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-text-primary text-body font-medium">Take photo</span>
            </div>
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChooseVerify() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <ChooseVerifyContent />
    </Suspense>
  );
}
