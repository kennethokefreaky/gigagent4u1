"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";

type TalentCategory = "Boxer" | "MMA" | "Comedian" | "Musician" | "Promoter" | "Other" | "Wrestler";

export default function CreateEventPage() {
  const router = useRouter();
  const isKeyboardVisible = useKeyboardVisibility();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State management
  const [selectedTalents, setSelectedTalents] = useState<TalentCategory[]>([]);
  const [showTalentBottomSheet, setShowTalentBottomSheet] = useState(false);
  const [selectedWeightClasses, setSelectedWeightClasses] = useState<string[]>([]);
  const [showWeightClassBottomSheet, setShowWeightClassBottomSheet] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isCameraActive, setCameraActive] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  const [gigTitle, setGigTitle] = useState("");
  const [showTitleBottomSheet, setShowTitleBottomSheet] = useState(false);
  const [gigDescription, setGigDescription] = useState("");
  const [showDescriptionBottomSheet, setShowDescriptionBottomSheet] = useState(false);
  const [address, setAddress] = useState("");
  const [showAddressBottomSheet, setShowAddressBottomSheet] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    description: string;
    place_id: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [addressError, setAddressError] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateBottomSheet, setShowDateBottomSheet] = useState(false);
  const [startTime, setStartTime] = useState("1:00 AM");
  const [endTime, setEndTime] = useState("1:00 PM");
  const [startHour, setStartHour] = useState("1");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("1");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("PM");
  const [showTimeBottomSheet, setShowTimeBottomSheet] = useState(false);
  const [gigAmount, setGigAmount] = useState("");
  const [showPaymentBottomSheet, setShowPaymentBottomSheet] = useState(false);

  const talentCategories: TalentCategory[] = ["Boxer", "MMA", "Comedian", "Musician", "Promoter", "Other", "Wrestler"];

  // Boxing weight classes data
  const boxingWeightClasses = [
    { name: "Minimumweight", range: "up to 105 lbs (47.6 kg)" },
    { name: "Light Flyweight", range: "106–108 lbs (48.1–49.0 kg)" },
    { name: "Flyweight", range: "109–112 lbs (49.4–50.8 kg)" },
    { name: "Super Flyweight", range: "113–115 lbs (51.3–52.2 kg)" },
    { name: "Bantamweight", range: "116–118 lbs (52.6–53.5 kg)" },
    { name: "Super Bantamweight", range: "119–122 lbs (54.0–55.3 kg)" },
    { name: "Featherweight", range: "123–126 lbs (55.8–57.2 kg)" },
    { name: "Super Featherweight", range: "127–130 lbs (57.6–59.0 kg)" },
    { name: "Lightweight", range: "131–135 lbs (59.4–61.2 kg)" },
    { name: "Super Lightweight", range: "136–140 lbs (61.7–63.5 kg)" },
    { name: "Welterweight", range: "141–147 lbs (64.0–66.7 kg)" },
    { name: "Super Welterweight", range: "148–154 lbs (67.1–69.9 kg)" },
    { name: "Middleweight", range: "155–160 lbs (70.3–72.6 kg)" },
    { name: "Super Middleweight", range: "161–168 lbs (73.0–76.2 kg)" },
    { name: "Light Heavyweight", range: "169–175 lbs (76.7–79.4 kg)" },
    { name: "Cruiserweight", range: "176–200 lbs (79.8–90.7 kg)" },
    { name: "Heavyweight", range: "over 200 lbs (90.7+ kg)" }
  ];

  const handleClose = () => {
    router.push("/addevent");
  };

  const handleCreatePost = () => {
    // Store event data in sessionStorage for preview pages
    const eventData = {
      selectedTalents,
      selectedWeightClasses,
      coverPhoto,
      gigTitle,
      gigDescription,
      address,
      startDate,
      endDate,
      startTime,
      endTime,
      gigAmount
    };
    sessionStorage.setItem('eventData', JSON.stringify(eventData));
    router.push("/postpreview");
  };

  // Talent selection
  const toggleTalent = (talent: TalentCategory) => {
    setSelectedTalents(prev => {
      const newTalents = prev.includes(talent) 
        ? prev.filter(t => t !== talent)
        : [...prev, talent];
      
      // Clear weight classes if Boxer is deselected
      if (talent === "Boxer" && !newTalents.includes("Boxer")) {
        setSelectedWeightClasses([]);
      }
      
      return newTalents;
    });
  };

  // Address suggestions using Google Places Autocomplete
  const fetchAddressSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 3) {
      setAddressSuggestions([]);
      setAddressError("");
      return;
    }

    setIsLoadingSuggestions(true);
    setAddressError("");

    try {
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();

      if (data.status === "OK" && data.predictions && data.predictions.length > 0) {
        const formattedSuggestions = data.predictions.slice(0, 4).map((p: {
          description: string;
          place_id: string;
          structured_formatting?: {
            main_text: string;
            secondary_text: string;
          };
        }) => ({
          description: p.description,
          place_id: p.place_id,
          structured_formatting: p.structured_formatting || {
            main_text: p.description.split(',')[0],
            secondary_text: p.description.split(',').slice(1).join(',').trim()
          },
        }));
        setAddressSuggestions(formattedSuggestions);
        setAddressError("");
      } else if (data.status === "ZERO_RESULTS") {
        setAddressSuggestions([]);
        setAddressError("No addresses found.");
      } else {
        console.error("Google API Error:", data.status, data.error_message);
        setAddressSuggestions([]);
        setAddressError("Unable to load suggestions.");
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setAddressSuggestions([]);
      setAddressError("Unable to load suggestions.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced address input handler
  const handleAddressInput = useCallback((value: string) => {
    setAddress(value);
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced API call
    debounceTimeoutRef.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 300);
  }, [fetchAddressSuggestions]);

  // Hydrate state from sessionStorage on mount (for editing existing events)
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('eventData');
      if (storedData) {
        const eventData = JSON.parse(storedData);
        
        // Hydrate form fields from stored event data
        if (eventData.coverPhoto) setCoverPhoto(eventData.coverPhoto);
        if (eventData.gigTitle) setGigTitle(eventData.gigTitle);
        if (eventData.gigDescription) setGigDescription(eventData.gigDescription);
        if (eventData.address) setAddress(eventData.address);
        if (eventData.startDate) setStartDate(eventData.startDate);
        if (eventData.endDate) setEndDate(eventData.endDate);
        if (eventData.startTime) setStartTime(eventData.startTime);
        if (eventData.endTime) setEndTime(eventData.endTime);
        if (eventData.gigAmount) setGigAmount(eventData.gigAmount);
        
        // Note: Intentionally NOT hydrating selectedTalents and selectedWeightClasses
        // This allows users to manually select talents/weight classes for imported events
        // or change their selections when editing existing events
      }
    } catch (error) {
      console.error('Error loading event data for editing:', error);
      // Continue with default state if parsing fails
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Handle address bottomsheet close
  const handleAddressBottomSheetClose = () => {
    setShowAddressBottomSheet(false);
    setAddressSuggestions([]);
    setAddressError("");
    setIsLoadingSuggestions(false);
    
    // Clear any pending debounced requests
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  // Photo handling
  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPhoto(e.target?.result as string);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = useCallback(async (facingMode?: 'user' | 'environment') => {
    try {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      ('ontouchstart' in window) || 
                      (navigator.maxTouchPoints > 0);
      
      let stream;
      const mode = facingMode || currentFacingMode;
      
      if (isMobile) {
        // Use the specified facing mode on mobile
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: mode } 
          });
        } catch (modeError) {
          console.log(`${mode} camera failed, trying opposite:`, modeError);
          // Fallback to opposite camera
          const fallbackMode = mode === 'environment' ? 'user' : 'environment';
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: fallbackMode } 
          });
          setCurrentFacingMode(fallbackMode);
        }
      } else {
        // On desktop, try any available camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
        } catch (desktopError) {
          console.log("Desktop camera failed:", desktopError);
          throw desktopError;
        }
      }
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setShowPhotoOptions(false);
      }
    } catch (error) {
      console.error("Camera access denied or failed:", error);
      alert("Camera access denied. Please allow camera permissions or use 'Choose from Library' instead.");
      setShowPhotoOptions(false);
    }
  }, [currentFacingMode]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL("image/jpeg");
      setCoverPhoto(imageData);
      setCameraActive(false);
      setShowPhotoOptions(false);
      
      // Stop camera stream
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const removePhoto = () => {
    setCoverPhoto(null);
  };

  const switchCamera = () => {
    const newMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    setCurrentFacingMode(newMode);
    
    // Stop current stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Start new stream with different camera
    startCamera(newMode);
  };

  // Time formatting functions
  const formatTime = (hour: string, minute: string, period: string) => {
    return `${hour}:${minute} ${period}`;
  };

  const updateStartTime = (hour?: string, minute?: string, period?: string) => {
    const h = hour || startHour;
    const m = minute || startMinute;
    const p = period || startPeriod;
    const formattedTime = formatTime(h, m, p);
    setStartTime(formattedTime);
  };

  const updateEndTime = (hour?: string, minute?: string, period?: string) => {
    const h = hour || endHour;
    const m = minute || endMinute;
    const p = period || endPeriod;
    const formattedTime = formatTime(h, m, p);
    setEndTime(formattedTime);
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = ['00', '15', '30', '45'];

  // Dynamic amount field label
  const getAmountLabel = () => {
    if (selectedTalents.includes("Boxer") || selectedTalents.includes("MMA")) {
      return "Fight purse per match";
    } else if (selectedTalents.includes("Comedian")) {
      return "Show fee";
    } else if (selectedTalents.includes("Musician")) {
      return "Performance fee (per gig)";
    } else {
      return "Booking rate";
    }
  };

  // Form validation
  const isFormValid = () => {
    return selectedTalents.length > 0 && 
           coverPhoto && 
           gigTitle && 
           gigDescription && 
           address && 
           startDate && 
           endDate && 
           startTime && 
           endTime && 
           gigAmount;
  };

  // Date range validation (for future use)
  // const isDateValid = (date: string) => {
  //   if (!startDate) return true;
  //   return new Date(date) >= new Date(startDate);
  // };

  // Time validation (for future use)
  // const isTimeValid = (time: string, isEndTime: boolean = false) => {
  //   if (!isEndTime || !startTime) return true;
  //   
  //   const parseTime = (timeStr: string) => {
  //     const [time, period] = timeStr.split(' ');
  //     const [hours, minutes] = time.split(':');
  //     let hour = parseInt(hours);
  //     if (period === 'PM' && hour !== 12) hour += 12;
  //     if (period === 'AM' && hour === 12) hour = 0;
  //     return hour * 60 + parseInt(minutes);
  //   };

  //   return parseTime(time) > parseTime(startTime);
  // };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-text-secondary">
        <button
          onClick={handleClose}
          className="p-2 hover:bg-surface rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-heading font-bold text-center flex-1 mr-10">
          Create Event
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Select an entertainer to hire */}
        <div>
          <label className="block text-body font-medium mb-2">
            Select an entertainer to hire
          </label>
          <button
            onClick={() => setShowTalentBottomSheet(true)}
            className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-left flex items-center justify-between"
          >
            <span className={selectedTalents.length > 0 ? "text-text-primary" : "text-text-secondary"}>
              {selectedTalents.length > 0 
                ? selectedTalents.join(", ") 
                : "Select your category"
              }
            </span>
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Select a weight class - Only show if Boxer is selected */}
        {selectedTalents.includes("Boxer") && (
          <div>
            <label className="block text-body font-medium mb-2">
              Select a weight class
            </label>
            <button
              onClick={() => setShowWeightClassBottomSheet(true)}
              className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-left flex items-center justify-between"
            >
              <span className={selectedWeightClasses.length > 0 ? "text-text-primary" : "text-text-secondary"}>
                {selectedWeightClasses.length > 0 
                  ? selectedWeightClasses.length === 1 
                    ? selectedWeightClasses[0]
                    : `${selectedWeightClasses.length} weight classes selected`
                  : "Choose weight classes"
                }
              </span>
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Showcase your event */}
        <div>
          <label className="block text-body font-medium mb-2">
            Showcase your event
          </label>
          <p className="text-text-secondary text-sm mb-3">
            Upload a cover photo to highlight your event
          </p>
          {coverPhoto ? (
            <div className="relative">
              <img 
                src={coverPhoto} 
                alt="Cover photo" 
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div 
              onClick={() => setShowPhotoOptions(true)}
              className="w-full h-48 border-2 border-dashed border-text-secondary rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-button-red transition-colors"
            >
              <svg className="w-12 h-12 text-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-text-primary font-medium">Upload photo</span>
              <span className="text-text-secondary text-sm mt-1">
                Tap to select from camera or library
              </span>
            </div>
          )}
        </div>

        {/* Event Info */}
        <div>
          <h2 className="text-subheading font-semibold mb-4">Event Info</h2>
          
          {/* Gig title */}
          <div className="mb-4">
            <label className="block text-body font-medium mb-2">Gig title</label>
            <button
              onClick={() => setShowTitleBottomSheet(true)}
              className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-left"
            >
              <span className={gigTitle ? "text-text-primary" : "text-text-secondary"}>
                {gigTitle || "Enter event title"}
              </span>
            </button>
          </div>

          {/* Gig description */}
          <div className="mb-4">
            <label className="block text-body font-medium mb-2">Gig description</label>
            <button
              onClick={() => setShowDescriptionBottomSheet(true)}
              className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-left min-h-[100px] flex items-start"
            >
              <span className={gigDescription ? "text-text-primary" : "text-text-secondary"}>
                {gigDescription || "Tell us about your event and what makes it special, such as the type of event or your experience in organizing similar events."}
              </span>
            </button>
            <div className="text-right text-text-secondary text-sm mt-1">
              {gigDescription.length}/500
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="block text-body font-medium mb-2">Address</label>
            <button
              onClick={() => setShowAddressBottomSheet(true)}
              className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-left flex items-center justify-between"
            >
              <span className={address ? "text-text-primary" : "text-text-secondary"}>
                {address || "Enter address"}
              </span>
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Date and Time */}
          <div className="mb-4">
            <label className="block text-body font-medium mb-2">Date and Time</label>
            
            {/* Date Range */}
            <div className="mb-3">
              <label className="block text-text-secondary text-sm mb-2">Date Range</label>
              <button
                onClick={() => setShowDateBottomSheet(true)}
                className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-left flex items-center justify-between"
              >
                <span className={startDate && endDate ? "text-text-primary" : "text-text-secondary"}>
                  {startDate && endDate 
                    ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                    : "Select start and end dates"
                  }
                </span>
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {/* Time */}
            <div>
              <label className="block text-text-secondary text-sm mb-2">Time</label>
              <button
                onClick={() => setShowTimeBottomSheet(true)}
                className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-left flex items-center justify-between"
              >
                <span className={startTime && endTime ? "text-text-primary" : "text-text-secondary"}>
                  {startTime && endTime ? `${startTime} - ${endTime}` : "Select time"}
                </span>
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Gig Amount */}
          <div>
            <label className="block text-body font-medium mb-2">{getAmountLabel()}</label>
            <button
              onClick={() => setShowPaymentBottomSheet(true)}
              className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-left flex items-center justify-between"
            >
              <span className={gigAmount ? "text-text-primary" : "text-text-secondary"}>
                {gigAmount ? `$${gigAmount}` : "Enter amount"}
              </span>
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Create Post Button */}
      <div className="px-4 pb-6">
        <button
          onClick={handleCreatePost}
          disabled={!isFormValid()}
          className={`w-full py-4 rounded-xl font-semibold transition-colors ${
            isFormValid()
              ? "bg-button-red hover:bg-button-red-hover text-white"
              : "bg-text-secondary text-text-primary cursor-not-allowed"
          }`}
        >
          Create Post
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Talent Selection Bottom Sheet */}
      {showTalentBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 max-h-[90vh] min-h-[60vh] overflow-y-auto bottom-sheet">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-subheading font-semibold">Select Categories</h3>
              <button
                onClick={() => setShowTalentBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            <div className="space-y-3">
              {talentCategories.map((talent) => (
                <button
                  key={talent}
                  onClick={() => toggleTalent(talent)}
                  className={`w-full p-3 rounded-xl border text-left transition-colors ${
                    selectedTalents.includes(talent)
                      ? "border-button-red bg-button-red bg-opacity-10"
                      : "border-text-secondary bg-input-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary">{talent}</span>
                    {selectedTalents.includes(talent) && (
                      <svg className="w-5 h-5 text-button-red" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weight Class Selection Bottom Sheet */}
      {showWeightClassBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 max-h-[90vh] min-h-[60vh] overflow-y-auto bottom-sheet">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-subheading font-semibold">Select Weight Class</h3>
              <button
                onClick={() => setShowWeightClassBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            <div className="mb-4">
              <div className="text-lg font-semibold text-text-primary mb-2">Boxing (men's professional)</div>
              <div className="text-sm text-text-secondary">Select the weight class for your event</div>
            </div>
            <div className="space-y-2">
              {/* All Weight Classes Option */}
              <div
                onClick={() => {
                  if (selectedWeightClasses.length === boxingWeightClasses.length) {
                    setSelectedWeightClasses([]);
                  } else {
                    setSelectedWeightClasses(boxingWeightClasses.map(wc => wc.name));
                  }
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedWeightClasses.length === boxingWeightClasses.length
                    ? "border-button-red bg-button-red bg-opacity-10"
                    : "border-text-secondary bg-input-background hover:border-button-red"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-text-primary">All Weight Classes</div>
                    <div className="text-sm text-text-secondary">Select all available weight classes</div>
                  </div>
                  {selectedWeightClasses.length === boxingWeightClasses.length && (
                    <svg className="w-5 h-5 text-button-red" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Individual Weight Classes */}
              {boxingWeightClasses.map((weightClass, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (selectedWeightClasses.includes(weightClass.name)) {
                      setSelectedWeightClasses(prev => prev.filter(wc => wc !== weightClass.name));
                    } else {
                      setSelectedWeightClasses(prev => [...prev, weightClass.name]);
                    }
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedWeightClasses.includes(weightClass.name)
                      ? "border-button-red bg-button-red bg-opacity-10"
                      : "border-text-secondary bg-input-background hover:border-button-red"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-text-primary">{weightClass.name}</div>
                      <div className="text-sm text-text-secondary">{weightClass.range}</div>
                    </div>
                    {selectedWeightClasses.includes(weightClass.name) && (
                      <svg className="w-5 h-5 text-button-red" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Options Bottom Sheet */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 min-h-[40vh] bottom-sheet">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-subheading font-semibold">Add Photo</h3>
              <button
                onClick={() => setShowPhotoOptions(false)}
                className="text-button-red font-semibold"
              >
                Cancel
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={handlePhotoUpload}
                className="w-full bg-input-background border border-text-secondary rounded-xl p-4 text-left hover:border-button-red transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-text-primary">Choose from Library</span>
                </div>
              </button>
              <button
                onClick={() => startCamera()}
                className="w-full bg-input-background border border-text-secondary rounded-xl p-4 text-left hover:border-button-red transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-text-primary">Take Photo</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera View */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <button
              onClick={() => {
                setCameraActive(false);
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
              }}
              className="text-white text-lg font-medium"
            >
              Cancel
            </button>
            <h3 className="text-white font-semibold text-lg">Take Photo</h3>
            {/* Camera Switch Button - Only show on mobile */}
            {(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
              ('ontouchstart' in window) || 
              (navigator.maxTouchPoints > 0)) && (
              <button
                onClick={switchCamera}
                className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Video Container */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            
            {/* Camera overlay frame */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-40 border-2 border-white border-dashed rounded-lg opacity-50"></div>
            </div>
          </div>
          
          {/* Capture Button */}
          <div className="p-6 flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-16 h-16 bg-button-red rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-full"></div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Title Bottom Sheet */}
      {showTitleBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 min-h-[40vh] bottom-sheet">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-subheading font-semibold">Gig Title</h3>
              <button
                onClick={() => setShowTitleBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            <input
              type="text"
              value={gigTitle}
              onChange={(e) => setGigTitle(e.target.value)}
              placeholder="Enter event title"
              className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-button-red"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Description Bottom Sheet */}
      {showDescriptionBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 max-h-[90vh] min-h-[60vh] bottom-sheet-with-textarea">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-subheading font-semibold">Gig Description</h3>
              <button
                onClick={() => setShowDescriptionBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            <textarea
              value={gigDescription}
              onChange={(e) => setGigDescription(e.target.value.slice(0, 500))}
              placeholder="Tell us about your event and what makes it special, such as the type of event or your experience in organizing similar events."
              className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-button-red min-h-[200px] resize-none"
              autoFocus
            />
            <div className="text-right text-text-secondary text-sm mt-2">
              {gigDescription.length}/500
            </div>
          </div>
        </div>
      )}

      {/* Address Bottom Sheet */}
      {showAddressBottomSheet && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleAddressBottomSheetClose();
            }
          }}
        >
          <div className="bg-surface w-full rounded-t-xl p-4 max-h-[90vh] min-h-[60vh] bottom-sheet-with-textarea overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-subheading font-semibold">Address</h3>
              <button
                onClick={handleAddressBottomSheetClose}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            
            {/* Address Input */}
            <div className="mb-4 flex-shrink-0">
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressInput(e.target.value)}
                placeholder="Enter address"
                className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-button-red"
                autoFocus
              />
            </div>

            {/* Suggestions Container - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingSuggestions && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-button-red"></div>
                  <span className="ml-2 text-text-secondary">Loading suggestions...</span>
                </div>
              )}

              {!isLoadingSuggestions && addressSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-text-secondary text-sm">Suggested addresses:</p>
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.place_id || index}
                      onClick={() => {
                        setAddress(suggestion.description);
                        handleAddressBottomSheetClose();
                      }}
                      className="w-full text-left p-4 bg-input-background rounded-xl hover:bg-surface transition-colors min-h-[44px] flex items-center"
                      style={{ minHeight: '44px' }}
                    >
                      <span className="text-text-primary">{suggestion.description}</span>
                    </button>
                  ))}
                </div>
              )}

              {!isLoadingSuggestions && addressError && (
                <div className="text-center py-4">
                  <p className="text-text-secondary">{addressError}</p>
                </div>
              )}

              {!isLoadingSuggestions && !addressError && addressSuggestions.length === 0 && address.length >= 2 && (
                <div className="text-center py-4">
                  <p className="text-text-secondary">No addresses found.</p>
                </div>
              )}

              {!isLoadingSuggestions && address.length < 3 && address.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-text-secondary">Type at least 3 characters to see suggestions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Range Bottom Sheet */}
      {showDateBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 max-h-[90vh] min-h-[60vh] bottom-sheet">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-button-red font-semibold"
              >
                Clear
              </button>
              <h3 className="text-subheading font-semibold">Select Date Range</h3>
              <button
                onClick={() => setShowDateBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            
            {startDate && endDate && (
              <div className="text-center mb-4">
                <span className="text-text-primary">
                  {new Date(startDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} → {new Date(endDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date Calendar */}
              <div>
                <h4 className="text-body font-medium mb-2 text-center">Start Date</h4>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && new Date(e.target.value) > new Date(endDate)) {
                      setEndDate("");
                    }
                  }}
                  className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-button-red"
                />
              </div>

              {/* End Date Calendar */}
              <div>
                <h4 className="text-body font-medium mb-2 text-center">End Date</h4>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-button-red"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Range Bottom Sheet */}
      {showTimeBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 max-h-[90vh] min-h-[60vh] bottom-sheet">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  setStartHour("1");
                  setStartMinute("00");
                  setStartPeriod("AM");
                  setEndHour("1");
                  setEndMinute("00");
                  setEndPeriod("PM");
                  setStartTime("1:00 AM");
                  setEndTime("1:00 PM");
                }}
                className="text-button-red font-semibold"
              >
                Clear
              </button>
              <h3 className="text-subheading font-semibold">Select Time Range</h3>
              <button
                onClick={() => setShowTimeBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Start Time */}
              <div>
                <h4 className="text-body font-medium mb-4 text-center">From</h4>
                <div className="space-y-3">
                  {/* Hour Selector */}
                  <select
                    value={startHour}
                    onChange={(e) => {
                      setStartHour(e.target.value);
                      updateStartTime(e.target.value, startMinute, startPeriod);
                    }}
                    className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-button-red"
                  >
                    {hourOptions.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  
                  {/* Minute Selector */}
                  <select
                    value={startMinute}
                    onChange={(e) => {
                      setStartMinute(e.target.value);
                      updateStartTime(startHour, e.target.value, startPeriod);
                    }}
                    className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-button-red"
                  >
                    {minuteOptions.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                  
                  {/* AM/PM Selector */}
                  <select
                    value={startPeriod}
                    onChange={(e) => {
                      setStartPeriod(e.target.value);
                      updateStartTime(startHour, startMinute, e.target.value);
                    }}
                    className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-button-red"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* End Time */}
              <div>
                <h4 className="text-body font-medium mb-4 text-center">To</h4>
                <div className="space-y-3">
                  {/* Hour Selector */}
                  <select
                    value={endHour}
                    onChange={(e) => {
                      setEndHour(e.target.value);
                      updateEndTime(e.target.value, endMinute, endPeriod);
                    }}
                    className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-button-red"
                  >
                    {hourOptions.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  
                  {/* Minute Selector */}
                  <select
                    value={endMinute}
                    onChange={(e) => {
                      setEndMinute(e.target.value);
                      updateEndTime(endHour, e.target.value, endPeriod);
                    }}
                    className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-button-red"
                  >
                    {minuteOptions.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                  
                  {/* AM/PM Selector */}
                  <select
                    value={endPeriod}
                    onChange={(e) => {
                      setEndPeriod(e.target.value);
                      updateEndTime(endHour, endMinute, e.target.value);
                    }}
                    className="w-full bg-input-background border border-text-secondary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-button-red"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Bottom Sheet */}
      {showPaymentBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-surface w-full rounded-t-xl p-4 min-h-[50vh] bottom-sheet">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setGigAmount("")}
                className="text-button-red font-semibold"
              >
                Reset
              </button>
              <h3 className="text-subheading font-semibold">{getAmountLabel()}</h3>
              <button
                onClick={() => setShowPaymentBottomSheet(false)}
                className="text-button-red font-semibold"
              >
                Confirm
              </button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-text-secondary text-sm mb-2">Amount in USD</p>
              <p className="text-3xl font-bold text-text-primary">${gigAmount || "0"}</p>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "⌫"].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "⌫") {
                      setGigAmount(prev => prev.slice(0, -1));
                    } else if (key === ".") {
                      if (!gigAmount.includes(".")) {
                        setGigAmount(prev => prev + ".");
                      }
                    } else {
                      setGigAmount(prev => prev + key.toString());
                    }
                  }}
                  className="bg-input-background border border-text-secondary rounded-xl p-4 text-text-primary font-semibold hover:bg-surface transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}