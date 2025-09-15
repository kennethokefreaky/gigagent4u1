"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function IDCameraContent() {
  const router = useRouter();
  const params = useSearchParams();
  const idType = params.get("idType") || "ID";
  const side = params.get("side") || "front";
  const country = params.get("country") || "United States";
  const roles = params.get("roles") || "";
  const name = params.get("name") || "User";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const startCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // For desktop, don't specify facingMode to avoid errors
      const videoConstraints = isMobileDevice 
        ? { 
            facingMode: mode, // Use specified camera mode for mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        : { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });
      
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      setCameraError(false);
      setShowFileUpload(false);
      
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
        setCameraError(false);
        setShowFileUpload(false);
        
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackError) {
        console.error('Camera not available:', fallbackError);
        setCameraError(true);
        setShowFileUpload(true);
        setIsCameraActive(false);
      }
    }
  }, [facingMode, isMobileDevice]);

  // Detect mobile/tablet devices
  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobileDevice(isMobile || isTablet || hasTouchScreen);
    };
    
    checkMobileDevice();
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

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
    setShowFileUpload(false);
    setCameraError(false);
    startCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        setShowFileUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const switchCamera = async () => {
    // Only allow camera switching on mobile devices
    if (!isMobileDevice) return;
    
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    await startCamera(newFacingMode);
  };

  const confirmPhoto = () => {
    // Here you would typically upload the image to your server
    console.log('Photo confirmed:', capturedImage);
    
    // Ensure we have a captured image
    if (!capturedImage) {
      console.error('No captured image available');
      return;
    }
    
    // For Driver License front, store image in sessionStorage and go to back license page
    if (idType === "Driver License" && side === "front") {
      console.log('Storing front image in sessionStorage and navigating to backlicense');
      // Store the front image in sessionStorage
      sessionStorage.setItem('driverLicenseFrontImage', capturedImage);
      router.push(`/backlicense?idType=${encodeURIComponent(idType)}&country=${encodeURIComponent(country)}&roles=${encodeURIComponent(roles)}&name=${encodeURIComponent(name)}`);
    } else {
      // For other cases, go to review screen
      router.push(`/reviewscreen?name=${encodeURIComponent(name)}&roles=${encodeURIComponent(roles)}`);
    }
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
          {side ? `Scan ${idType.toLowerCase()} ${side}` : `Scan ${idType.toLowerCase()}`}
        </h1>
        
        <button className="flex items-center text-text-primary hover:text-text-secondary transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 bg-background flex items-center justify-center p-4">
        {capturedImage ? (
          // Show captured image
          <div className="w-full max-w-sm">
            <img 
              src={capturedImage} 
              alt="Captured ID" 
              className="w-full h-64 object-contain rounded-lg border-2 border-text-secondary"
            />
          </div>
        ) : showFileUpload ? (
          // Show file upload when camera is not available
          <div className="w-full max-w-sm text-center">
            <div className="border-2 border-dashed border-text-secondary rounded-lg p-8 bg-input-background">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-text-primary mb-4">Camera not available</p>
              <p className="text-text-secondary text-sm mb-4">Upload a photo of your ID instead</p>
              <button
                onClick={triggerFileUpload}
                className="bg-button-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-button-red-hover transition-colors"
              >
                Choose Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
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
                className="w-full h-64 object-cover rounded-lg border-2 border-text-secondary"
              />
              {!isCameraActive && !cameraError && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <p className="text-white text-center">
                    Starting camera...<br />
                    <span className="text-sm">Please allow camera access</span>
                  </p>
                </div>
              )}
              {/* Camera Switch Button - Only on Mobile/Tablet */}
              {isCameraActive && isMobileDevice && (
                <button
                  onClick={switchCamera}
                  className="absolute top-3 right-3 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
                  title={`Switch to ${facingMode === 'environment' ? 'front' : 'back'} camera`}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-surface px-4 py-6 border-t border-text-secondary">
        {capturedImage ? (
          // Photo captured controls
          <div className="flex justify-center space-x-4">
            <button
              onClick={retakePhoto}
              className="px-6 py-3 bg-input-background text-text-primary rounded-lg hover:bg-background transition-colors border border-text-secondary"
            >
              Retake
            </button>
            <button
              onClick={confirmPhoto}
              className="px-6 py-3 bg-button-red text-white rounded-lg hover:bg-button-red-hover transition-colors"
            >
              Use Photo
            </button>
          </div>
        ) : showFileUpload ? (
          // File upload controls
          <div className="flex justify-center">
            <button
              onClick={triggerFileUpload}
              className="bg-button-red text-white px-8 py-3 rounded-lg font-semibold hover:bg-button-red-hover transition-colors"
            >
              Choose Photo
            </button>
          </div>
        ) : (
          // Camera controls
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              disabled={!isCameraActive}
              className="w-16 h-16 bg-button-red rounded-full flex items-center justify-center shadow-lg hover:bg-button-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-button-red rounded-full"></div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default function IDCamera() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <IDCameraContent />
    </Suspense>
  );
}
