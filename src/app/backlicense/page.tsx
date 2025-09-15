"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BackLicenseContent() {
  const router = useRouter();
  const params = useSearchParams();
  const idType = params.get("idType") || "Driver License";
  const country = params.get("country") || "United States";
  const roles = params.get("roles") || "";
  const name = params.get("name") || "User";
  
  // Get front image from sessionStorage
  const [frontImage, setFrontImage] = useState<string>("");
  
  // Load front image from sessionStorage on component mount
  useEffect(() => {
    const storedFrontImage = sessionStorage.getItem('driverLicenseFrontImage');
    if (storedFrontImage) {
      setFrontImage(storedFrontImage);
      console.log('BackLicense - Loaded front image from sessionStorage, length:', storedFrontImage.length);
    } else {
      console.error('BackLicense - No front image found in sessionStorage');
    }
  }, []);
  
  // Debug logging
  console.log('BackLicense - Received params:', {
    idType,
    country,
    roles,
    name,
    frontImageLength: frontImage.length
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array to run only once

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to any available camera
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        setIsCameraActive(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackError) {
        console.error('Camera not available:', fallbackError);
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);

        // Stop the camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          setIsCameraActive(false);
        }
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    // Store both images in sessionStorage
    if (capturedImage) {
      sessionStorage.setItem('driverLicenseBackImage', capturedImage);
      console.log('BackLicense - Stored back image in sessionStorage');
    }
    
    // Clear the front image from sessionStorage since we're done with it
    sessionStorage.removeItem('driverLicenseFrontImage');
    
    // Navigate directly to review screen
    router.push(`/reviewscreen?name=${encodeURIComponent(name)}&roles=${encodeURIComponent(roles)}`);
  };

  const goBack = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    router.back();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <button 
          onClick={goBack}
          className="flex items-center text-text-primary hover:text-text-secondary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-text-primary">
          Scan {idType.toLowerCase()} back
        </h1>
        
        <button className="flex items-center text-text-primary hover:text-text-secondary transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 bg-input-background flex items-center justify-center p-4">
        {capturedImage ? (
          // Show captured image
          <div className="w-full max-w-sm">
            <img 
              src={capturedImage} 
              alt="Captured ID Back" 
              className="w-full h-48 object-cover rounded-lg border-2 border-white"
            />
          </div>
        ) : (
          // Show camera feed
          <div className="w-full max-w-sm">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-48 object-cover rounded-lg border-2 border-white"
              />
              {!isCameraActive && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <p className="text-white text-center">
                    Camera not available<br />
                    <span className="text-sm">Please allow camera access</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-6">
        {capturedImage ? (
          // Photo captured controls
          <div className="flex justify-center space-x-4">
            <button
              onClick={retakePhoto}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retake
            </button>
            <button
              onClick={confirmPhoto}
              className="px-6 py-3 bg-button-red text-white rounded-lg hover:bg-button-red-hover transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          // Camera controls
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              disabled={!isCameraActive}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default function BackLicense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <BackLicenseContent />
    </Suspense>
  );
}
