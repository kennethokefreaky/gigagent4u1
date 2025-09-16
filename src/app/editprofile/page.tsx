"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";
import Navigation from "../components/Navigation";
import { Snackbar, Alert, Slide, SlideProps, Dialog, DialogContent, IconButton } from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";

export default function EditProfilePage() {
  const router = useRouter();
  const isKeyboardVisible = useKeyboardVisibility();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    achievements: [],
    socialLinks: [],
    boxingWeightClass: "",
    mmaWeightClass: "",
    height: "",
    weight: "",
    phoneNumber: ""
  });

  // Load profile data from Supabase on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Error getting user:', authError);
          return;
        }

        // Load profile data from Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          return;
        }

        // Set form data with Supabase data (empty strings for blank fields)
        setFormData({
          fullName: profile.full_name || "",
          bio: profile.bio || "",
          achievements: profile.achievements || [],
          socialLinks: profile.social_links || [],
          boxingWeightClass: profile.boxing_weight_class || "",
          mmaWeightClass: profile.mma_weight_class || "",
          height: profile.height || "",
          weight: profile.weight || "",
          phoneNumber: profile.phone_number || ""
        });

        // Set profile image if available
        if (profile.profile_image_url) {
          setProfileImage(profile.profile_image_url);
        }

        // Set user type and talent categories
        setUserType(profile.role || "promoter");
        
        // Check if user is a fighting sport athlete
        const categories = profile.talent_categories || [];
        const fightingSportsList = ['Boxer', 'MMA', 'Wrestler'];
        const userFightingSports = categories.filter((cat: string) => fightingSportsList.includes(cat));
        
        setIsBoxer(categories.includes('Boxer'));
        setIsMMA(categories.includes('MMA'));
        setIsWrestler(categories.includes('Wrestler'));
        setFightingSports(userFightingSports);

        console.log('Edit profile data loaded from Supabase:', profile);
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, []);

  // Auto-adjust tempWeight when weight class changes
  useEffect(() => {
    if (formData.boxingWeightClass) {
      const limits = getWeightLimits();
      // If current tempWeight is outside the new range, adjust it
      if (tempWeight < limits.min) {
        setTempWeight(limits.min);
      } else if (tempWeight > limits.max) {
        setTempWeight(limits.max);
      }
    }
  }, [formData.boxingWeightClass, formData.mmaWeightClass]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalValue, setModalValue] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [talentSelectionOpen, setTalentSelectionOpen] = useState(false);
  const [selectedTalents, setSelectedTalents] = useState<any[]>([]);
  const [sentFeedbackTalents, setSentFeedbackTalents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHeightModal, setShowHeightModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showBoxingWeightModal, setShowBoxingWeightModal] = useState(false);
  const [showMMAWeightModal, setShowMMAWeightModal] = useState(false);
  const [tempHeight, setTempHeight] = useState({ feet: 5, inches: 6 });
  const [tempWeight, setTempWeight] = useState(150);
  const [tempBoxingWeightClass, setTempBoxingWeightClass] = useState("");
  const [tempMMAWeightClass, setTempMMAWeightClass] = useState("");

  // Boxing weight classes data
  const boxingWeightClasses = [
    { name: "Minimumweight", range: "up to 105 lbs (47.6 kg)", minWeight: 0, maxWeight: 105 },
    { name: "Light Flyweight", range: "106–108 lbs (48.1–49.0 kg)", minWeight: 106, maxWeight: 108 },
    { name: "Flyweight", range: "109–112 lbs (49.4–50.8 kg)", minWeight: 109, maxWeight: 112 },
    { name: "Super Flyweight", range: "113–115 lbs (51.3–52.2 kg)", minWeight: 113, maxWeight: 115 },
    { name: "Bantamweight", range: "116–118 lbs (52.6–53.5 kg)", minWeight: 116, maxWeight: 118 },
    { name: "Super Bantamweight", range: "119–122 lbs (54.0–55.3 kg)", minWeight: 119, maxWeight: 122 },
    { name: "Featherweight", range: "123–126 lbs (55.8–57.2 kg)", minWeight: 123, maxWeight: 126 },
    { name: "Super Featherweight", range: "127–130 lbs (57.6–59.0 kg)", minWeight: 127, maxWeight: 130 },
    { name: "Lightweight", range: "131–135 lbs (59.4–61.2 kg)", minWeight: 131, maxWeight: 135 },
    { name: "Super Lightweight", range: "136–140 lbs (61.7–63.5 kg)", minWeight: 136, maxWeight: 140 },
    { name: "Welterweight", range: "141–147 lbs (64.0–66.7 kg)", minWeight: 141, maxWeight: 147 },
    { name: "Super Welterweight", range: "148–154 lbs (67.1–69.9 kg)", minWeight: 148, maxWeight: 154 },
    { name: "Middleweight", range: "155–160 lbs (70.3–72.6 kg)", minWeight: 155, maxWeight: 160 },
    { name: "Super Middleweight", range: "161–168 lbs (73.0–76.2 kg)", minWeight: 161, maxWeight: 168 },
    { name: "Light Heavyweight", range: "169–175 lbs (76.7–79.4 kg)", minWeight: 169, maxWeight: 175 },
    { name: "Cruiserweight", range: "176–200 lbs (79.8–90.7 kg)", minWeight: 176, maxWeight: 200 },
    { name: "Heavyweight", range: "over 200 lbs (90.7+ kg)", minWeight: 201, maxWeight: 500 }
  ];

  // MMA weight classes data
  const mmaWeightClasses = [
    { name: "Strawweight", range: "up to 115 lbs (52.2 kg)", minWeight: 0, maxWeight: 115 },
    { name: "Flyweight", range: "116–125 lbs (52.6–56.7 kg)", minWeight: 116, maxWeight: 125 },
    { name: "Bantamweight", range: "126–135 lbs (57.1–61.2 kg)", minWeight: 126, maxWeight: 135 },
    { name: "Featherweight", range: "136–145 lbs (61.7–65.8 kg)", minWeight: 136, maxWeight: 145 },
    { name: "Lightweight", range: "146–155 lbs (66.2–70.3 kg)", minWeight: 146, maxWeight: 155 },
    { name: "Welterweight", range: "156–170 lbs (70.8–77.1 kg)", minWeight: 156, maxWeight: 170 },
    { name: "Middleweight", range: "171–185 lbs (77.6–83.9 kg)", minWeight: 171, maxWeight: 185 },
    { name: "Light Heavyweight", range: "186–205 lbs (84.4–93.0 kg)", minWeight: 186, maxWeight: 205 },
    { name: "Heavyweight", range: "206–265 lbs (93.4–120.2 kg)", minWeight: 206, maxWeight: 265 }
  ];

  // Check if user is a fighting sport athlete
  const [isBoxer, setIsBoxer] = useState(false);
  const [isMMA, setIsMMA] = useState(false);
  const [isWrestler, setIsWrestler] = useState(false);
  const [fightingSports, setFightingSports] = useState<string[]>([]);
  const [userType, setUserType] = useState<string>("");

  // Get weight limits based on selected weight class
  const getWeightLimits = () => {
    // Check boxing weight classes first
    if (formData.boxingWeightClass) {
      const selectedBoxingClass = boxingWeightClasses.find(
        weightClass => weightClass.name === formData.boxingWeightClass
      );
      if (selectedBoxingClass) {
        return { min: selectedBoxingClass.minWeight, max: selectedBoxingClass.maxWeight };
      }
    }
    
    // Check MMA weight classes
    if (formData.mmaWeightClass) {
      const selectedMMAClass = mmaWeightClasses.find(
        weightClass => weightClass.name === formData.mmaWeightClass
      );
      if (selectedMMAClass) {
        return { min: selectedMMAClass.minWeight, max: selectedMMAClass.maxWeight };
      }
    }
    
    return { min: 0, max: 500 }; // Default range if no weight class selected
  };

  // Detect device type
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Handle photo capture/upload
  const handlePhotoUpload = () => {
    if (isMobile()) {
      // Mobile/Tablet: Show options for camera or gallery
      handleMobilePhotoSelection();
    } else {
      // Desktop: Open file picker
      fileInputRef.current?.click();
    }
  };

  const handleMobilePhotoSelection = () => {
    // Create a temporary input with camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera if available
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };
    input.click();
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
        // Here you would typically upload to server
        console.log('Profile image updated:', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addAchievement = () => {
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, `Achievement #${prev.achievements.length + 1}`]
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const updateAchievement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.map((achievement, i) => 
        i === index ? value : achievement
      )
    }));
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ""]
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const updateSocialLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => 
        i === index ? value : link
      )
    }));
  };

  const openModal = (type: string, currentValue: string) => {
    setActiveModal(type);
    setModalValue(currentValue);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalValue("");
  };

  const openBoxingWeightModal = () => {
    setTempBoxingWeightClass(formData.boxingWeightClass);
    setShowBoxingWeightModal(true);
  };

  const openMMAWeightModal = () => {
    setTempMMAWeightClass(formData.mmaWeightClass);
    setShowMMAWeightModal(true);
  };

  const saveBoxingWeightClass = () => {
    setFormData(prev => ({ ...prev, boxingWeightClass: tempBoxingWeightClass }));
    setShowBoxingWeightModal(false);
  };

  const saveMMAWeightClass = () => {
    setFormData(prev => ({ ...prev, mmaWeightClass: tempMMAWeightClass }));
    setShowMMAWeightModal(false);
  };

  const saveModal = () => {
    if (activeModal === 'fullName') {
      setFormData(prev => ({ ...prev, fullName: modalValue }));
    } else if (activeModal === 'phoneNumber') {
      setFormData(prev => ({ ...prev, phoneNumber: modalValue }));
    } else if (activeModal === 'bio') {
      setFormData(prev => ({ ...prev, bio: modalValue }));
    } else if (activeModal?.startsWith('achievement-')) {
      const index = parseInt(activeModal.split('-')[1]);
      if (index === 0 && formData.achievements.length === 0) {
        // Adding first achievement
        setFormData(prev => ({ ...prev, achievements: [modalValue] }));
      } else {
        updateAchievement(index, modalValue);
      }
    } else if (activeModal?.startsWith('social-')) {
      const index = parseInt(activeModal.split('-')[1]);
      if (index === 0 && formData.socialLinks.length === 0) {
        // Adding first social link
        if (modalValue.trim() !== '') {
          setFormData(prev => ({ ...prev, socialLinks: [modalValue] }));
        }
      } else {
        // If the value is empty, remove the social link from the array
        if (modalValue.trim() === '') {
          setFormData(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter((_, i) => i !== index)
          }));
        } else {
          updateSocialLink(index, modalValue);
        }
      }
    }
    closeModal();
  };

  // Validate social links
  const validateSocialLinks = () => {
    const validSocialDomains = [
      'instagram.com', 'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 
      'youtube.com', 'tiktok.com', 'snapchat.com', 'pinterest.com', 'github.com'
    ];
    
    for (const link of formData.socialLinks) {
      // Allow empty fields - only validate if there's content
      if (!link || link.trim() === '') {
        continue; // Skip validation for empty fields
      }
      
      // Check if it's a valid URL
      try {
        const url = new URL(link);
        const domain = url.hostname.toLowerCase();
        
        // Check if domain contains any valid social media platform
        const isValidDomain = validSocialDomains.some(validDomain => 
          domain.includes(validDomain)
        );
        
        if (!isValidDomain) {
          return { isValid: false, message: 'Please add a valid social media link (Instagram, LinkedIn, Facebook, etc.)' };
        }
      } catch (error) {
        return { isValid: false, message: 'Please add a proper social link URL' };
      }
    }
    
    return { isValid: true, message: '' };
  };

  const handleSave = async () => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('talentSelectionOpen:', talentSelectionOpen);
    console.log('selectedTalents:', selectedTalents);
    console.log('sentFeedbackTalents:', sentFeedbackTalents);
    
    // Validate social links
    const validation = validateSocialLinks();
    
    if (!validation.isValid) {
      setToastMessage(validation.message);
      setToastOpen(true);
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Error getting user:', authError);
        setToastMessage('Error saving profile. Please try again.');
        setToastOpen(true);
        return;
      }

      // Filter out empty achievements and social links
      const filteredAchievements = formData.achievements.filter(achievement => achievement && achievement.trim() !== "");
      const filteredSocialLinks = formData.socialLinks.filter(link => link && link.trim() !== "");
      
      // Save profile data to Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName || null,
          bio: formData.bio || null,
          achievements: filteredAchievements,
          social_links: filteredSocialLinks,
          boxing_weight_class: formData.boxingWeightClass || null,
          mma_weight_class: formData.mmaWeightClass || null,
          height: formData.height || null,
          weight: formData.weight || null,
          phone_number: formData.phoneNumber || null,
          profile_image_url: profileImage || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setToastMessage('Error saving profile. Please try again.');
        setToastOpen(true);
        return;
      }

      console.log('Profile saved to Supabase successfully');
      
      // Dispatch custom event to notify GoalSection of profile save
      window.dispatchEvent(new CustomEvent('profileSaved'));
      
      router.push('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      setToastMessage('Error saving profile. Please try again.');
      setToastOpen(true);
    }
  };

  // Slide transition for toast - slides from bottom for better mobile UX
  const SlideTransition = (props: SlideProps) => {
    return <Slide {...props} direction="up" />;
  };

  // Dummy talent data
  const dummyTalents = [
    { id: 1, name: "Sarah Johnson", category: "DJ", avatar: "🎧", rating: 4.8, reviews: 24 },
    { id: 2, name: "Mike Chen", category: "Photographer", avatar: "📸", rating: 4.9, reviews: 31 },
    { id: 3, name: "Emma Davis", category: "Videographer", avatar: "🎥", rating: 4.7, reviews: 18 },
    { id: 4, name: "Alex Rodriguez", category: "Musician", avatar: "🎵", rating: 4.9, reviews: 42 },
    { id: 5, name: "Lisa Wang", category: "Dancer", avatar: "💃", rating: 4.6, reviews: 15 },
    { id: 6, name: "David Kim", category: "Host", avatar: "🎤", rating: 4.8, reviews: 28 },
    { id: 7, name: "Maria Garcia", category: "Comedian", avatar: "😂", rating: 4.7, reviews: 22 },
    { id: 8, name: "Tom Wilson", category: "Security", avatar: "🛡️", rating: 4.9, reviews: 35 },
    { id: 9, name: "Anna Brown", category: "Caterer", avatar: "🍽️", rating: 4.8, reviews: 19 },
    { id: 10, name: "Chris Taylor", category: "Decorator", avatar: "🎨", rating: 4.6, reviews: 26 }
  ];

  // Filter talents based on search query and exclude sent feedback talents
  const filteredTalents = dummyTalents.filter(talent => {
    const matchesSearch = talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         talent.category.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotSent = !sentFeedbackTalents.some(sent => sent.id === talent.id);
    return matchesSearch && isNotSent;
  });

  // Handle talent selection (toggle between selected/unselected)
  const handleTalentSelect = (talent: any) => {
    setSelectedTalents(prev => {
      const isSelected = prev.some(t => t.id === talent.id);
      if (isSelected) {
        return prev.filter(t => t.id !== talent.id);
      } else {
        return [...prev, talent];
      }
    });
  };

  // Send feedback reminders
  const handleSendFeedback = () => {
    if (selectedTalents.length === 0) {
      setToastMessage("Please select at least one talent");
      setToastOpen(true);
      return;
    }
    
    // Here you would typically send API request
    console.log('Sending feedback reminders to:', selectedTalents);
    setToastMessage(`Feedback reminders sent to ${selectedTalents.length} talent(s)`);
    setToastOpen(true);
    
    // Close the modal first
    setTalentSelectionOpen(false);
    console.log('Talent selection modal closed');
    
    // Move selected talents to sent feedback list (avoiding duplicates)
    setSentFeedbackTalents(prev => {
      const existingIds = new Set(prev.map(talent => talent.id));
      const newTalents = selectedTalents.filter(talent => !existingIds.has(talent.id));
      return [...prev, ...newTalents];
    });
    setSelectedTalents([]);
    setSearchQuery("");
    
    // Force a small delay to ensure modal is fully closed
    setTimeout(() => {
      console.log('Modal should be fully closed now');
    }, 100);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      {/* Header */}
      <div className="relative">
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
          
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Save Button - Hide when any modal is open */}
          {!activeModal && !showHeightModal && !showWeightModal && !showBoxingWeightModal && !showMMAWeightModal && !talentSelectionOpen && (
            <button 
              onClick={handleSave}
              className="absolute top-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-gray-100 hover:shadow-xl transition-all duration-200 border border-gray-200 z-50"
              style={{ zIndex: 9999 }}
            >
              Save
            </button>
          )}
        </div>

        {/* Profile Picture */}
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div 
              className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={handlePhotoUpload}
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
            {/* Camera Icon */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          {/* Hidden file input for desktop */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white pt-16 px-6 pb-8">
        {/* Form Fields */}
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div 
              onClick={() => openModal('fullName', formData.fullName)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black"
            >
              {formData.fullName || "Type your full name"}
            </div>
          </div>

          {/* Phone Number - Only show for promoters */}
          {userType === "promoter" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div 
                onClick={() => openModal('phoneNumber', formData.phoneNumber)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black"
              >
                {formData.phoneNumber || "Type your phone number"}
              </div>
            </div>
          )}

          {/* Weight Class - Only show for talent users with fighting sports */}
          {userType === "talent" && fightingSports.length > 0 && (
            <div className="space-y-4">
              {/* Boxing Weight Class */}
              {isBoxer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boxing Weight Class
                    {fightingSports.length > 1 && (
                      <span className="text-xs text-gray-500 ml-2">(Boxing)</span>
                    )}
                  </label>
                  <div 
                    onClick={openBoxingWeightModal}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black"
                  >
                    {formData.boxingWeightClass || "Choose a boxing weight class"}
                  </div>
                </div>
              )}

              {/* MMA Weight Class */}
              {isMMA && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MMA Weight Class
                    {fightingSports.length > 1 && (
                      <span className="text-xs text-gray-500 ml-2">(MMA)</span>
                    )}
                  </label>
                  <div 
                    onClick={openMMAWeightModal}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black"
                  >
                    {formData.mmaWeightClass || "Choose an MMA weight class"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Height and Weight - Only show for talent users with fighting sports */}
          {userType === "talent" && fightingSports.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height and Weight
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Height */}
                <div>
                  <div 
                    onClick={() => setShowHeightModal(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black"
                  >
                    {formData.height || "Choose your height"}
                  </div>
                </div>
                
                {/* Weight */}
                <div>
                  <div 
                    onClick={() => setShowWeightModal(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black"
                  >
                    {formData.weight || "Choose your weight"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <div 
              onClick={() => openModal('bio', formData.bio)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[80px] text-black"
            >
              {formData.bio || "Type your bio"}
            </div>
          </div>

          {/* Achievements Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black">Achievements</h3>
            
            {formData.achievements.length > 0 ? (
              formData.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    onClick={() => openModal(`achievement-${index}`, achievement)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black"
                  >
                    {achievement || "Type an achievement"}
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeAchievement(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-2">
                <div 
                  onClick={() => openModal('achievement-0', '')}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-gray-500"
                >
                  Type an achievement
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addAchievement}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                + Add Achievement
              </button>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black">Social Media</h3>
            
            {formData.socialLinks.length > 0 ? (
              formData.socialLinks.map((link, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    onClick={() => openModal(`social-${index}`, link)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black"
                  >
                    {link || "Type a social link"}
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-2">
                <div 
                  onClick={() => openModal('social-0', '')}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-gray-500"
                >
                  Type a social link
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addSocialLink}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                + Add Social Link
              </button>
            </div>
          </div>

          {/* Ratings & Comments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black">Ratings & Comments</h3>
            <p className="text-sm text-gray-500">Send talents a reminder to share feedback</p>
            
            {/* Ask for Feedback Button */}
            <div 
              onClick={() => setTalentSelectionOpen(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-black text-center"
            >
              Ask talents for feedback
            </div>

            {/* Pending Reviews */}
            {selectedTalents.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-black">Pending Reviews</h4>
                {selectedTalents.map((talent, index) => (
                  <div key={`pending-${talent.id}-${index}`} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm">{talent.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-black text-sm">{talent.name}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{talent.category}</span>
                        </div>
                        <div className="text-xs text-yellow-600 font-medium">Pending Review</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sent Feedback Reminders */}
            {sentFeedbackTalents.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-black">Sent Feedback Reminders</h4>
                {sentFeedbackTalents.map((talent, index) => (
                  <div key={`sent-${talent.id}-${index}`} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm">{talent.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-black text-sm">{talent.name}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{talent.category}</span>
                        </div>
                        <div className="text-xs text-green-600 font-medium">Feedback Reminder Sent</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Nav */}
      <Navigation />

      {/* Bottomsheet Modal - Dark Theme */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-70"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="relative w-full h-full bg-background shadow-xl flex flex-col bottom-sheet-with-textarea">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-text-primary">
                {activeModal === 'fullName' && 'Full Name'}
                {activeModal === 'phoneNumber' && 'Phone Number'}
                {activeModal === 'bio' && 'Bio'}
                {activeModal?.startsWith('achievement-') && 'Achievement'}
                {activeModal?.startsWith('social-') && 'Social Link'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 flex flex-col">
              <textarea
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                className="flex-1 w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-text-primary placeholder-text-secondary bg-input-background"
                rows={activeModal === 'bio' ? 12 : 8}
                placeholder={
                  activeModal === 'fullName' ? 'Enter your full name' :
                  activeModal === 'phoneNumber' ? 'Enter your phone number (e.g., +1-555-123-4567)' :
                  activeModal === 'bio' ? 'Tell us about yourself...' :
                  activeModal?.startsWith('achievement-') ? 'Enter achievement name' :
                  'https://instagram.com/username'
                }
                autoFocus
              />
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-600">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveModal}
                className="px-4 py-2 bg-button-red text-white rounded-lg hover:bg-button-red-hover transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Talent Selection Full Screen Modal - Dark Theme */}
      {talentSelectionOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-600 flex-shrink-0">
            <h3 className="text-lg font-semibold text-text-primary">Select Talents</h3>
            <button
              onClick={() => setTalentSelectionOpen(false)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close talent selection"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-600 flex-shrink-0">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search talents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-input-background text-text-primary placeholder-text-secondary"
              />
            </div>
          </div>

          {/* Talent List - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {filteredTalents.map((talent) => {
              const isSelected = selectedTalents.some(t => t.id === talent.id);
              return (
                <div
                  key={talent.id}
                  className={`p-4 border-b border-gray-600 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-900/20' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => handleTalentSelect(talent)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xl">{talent.avatar}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{talent.name}</div>
                        <div className="text-sm text-text-secondary">{talent.category}</div>
                        <div className="flex items-center space-x-2 text-sm text-text-secondary">
                          <span>⭐ {talent.rating}</span>
                          <span>•</span>
                          <span>{talent.reviews} reviews</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTalentSelect(talent);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Ask for feedback'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer - Sticky */}
          <div className="p-4 border-t border-gray-600 bg-background flex-shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-text-secondary">
                {selectedTalents.length} talent(s) selected
              </span>
            </div>
            <button
              onClick={handleSendFeedback}
              className="w-full bg-button-red text-white py-3 rounded-lg font-medium hover:bg-button-red-hover transition-colors"
            >
              Send Feedback Reminders
            </button>
          </div>
        </div>
      )}

      {/* MUI Toast Notification - Bottom Position for Mobile/Tablet UX */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          // Mobile/Tablet optimizations
          '& .MuiSnackbarContent-root': {
            minWidth: 'auto',
            maxWidth: '100%',
            margin: '16px',
            borderRadius: '8px',
            // Ensure it doesn't overlap with bottom navigation
            marginBottom: '80px', // Space for bottom navigation
          }
        }}
      >
        <Alert 
          onClose={() => setToastOpen(false)} 
          severity="success" 
          sx={{ 
            width: '100%',
            // Mobile-friendly styling
            '& .MuiAlert-message': {
              fontSize: '14px',
              lineHeight: '1.4',
            },
            '& .MuiAlert-action': {
              paddingLeft: '8px',
            }
          }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      {/* Height Modal - Full Screen Takeover - Dark Theme */}
      {showHeightModal && (
        <div 
          className="fixed inset-0 bg-background z-50 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHeightModal(false);
            }
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-600 bg-background">
            <h2 className="text-xl font-semibold text-text-primary">Choose your height</h2>
            <button 
              onClick={() => setShowHeightModal(false)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close height selection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6 space-y-8 overflow-y-auto">
            {/* Current Height Display - Large and Prominent */}
            <div className="text-center py-8 bg-gray-800 rounded-2xl border-2 border-gray-600">
              <div className="text-4xl font-bold text-text-primary mb-2">
                {tempHeight.feet}'{tempHeight.inches}"
              </div>
              <div className="text-lg text-text-secondary">Your Height</div>
            </div>
            
            {/* Feet Slider */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-text-primary">
                Feet: {tempHeight.feet}
              </label>
              <div className="px-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={tempHeight.feet}
                  onChange={(e) => setTempHeight(prev => ({ ...prev, feet: parseInt(e.target.value) }))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(tempHeight.feet / 10) * 100}%, #e5e7eb ${(tempHeight.feet / 10) * 100}%, #e5e7eb 100%)`
                  }}
                  aria-label={`Feet: ${tempHeight.feet}`}
                />
              </div>
              <div className="flex justify-between text-sm text-text-secondary px-4">
                <span>0'</span>
                <span>10'</span>
              </div>
            </div>
            
            {/* Inches Slider */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-text-primary">
                Inches: {tempHeight.inches}
              </label>
              <div className="px-4">
                <input
                  type="range"
                  min="0"
                  max="11"
                  value={tempHeight.inches}
                  onChange={(e) => setTempHeight(prev => ({ ...prev, inches: parseInt(e.target.value) }))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(tempHeight.inches / 11) * 100}%, #e5e7eb ${(tempHeight.inches / 11) * 100}%, #e5e7eb 100%)`
                  }}
                  aria-label={`Inches: ${tempHeight.inches}`}
                />
              </div>
              <div className="flex justify-between text-sm text-text-secondary px-4">
                <span>0"</span>
                <span>11"</span>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-600 bg-background">
            <button
              onClick={() => {
                setFormData(prev => ({ 
                  ...prev, 
                  height: `${tempHeight.feet}'${tempHeight.inches}"` 
                }));
                setShowHeightModal(false);
              }}
              className="w-full bg-button-red text-white py-4 rounded-xl font-semibold text-lg hover:bg-button-red-hover transition-colors shadow-lg"
              aria-label={`Save height ${tempHeight.feet}'${tempHeight.inches}"`}
            >
              Save Height
            </button>
          </div>
        </div>
      )}

      {/* Weight Modal - Full Screen Takeover - Dark Theme */}
      {showWeightModal && (
        <div 
          className="fixed inset-0 bg-background z-50 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWeightModal(false);
            }
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-600 bg-background">
            <h2 className="text-xl font-semibold text-text-primary">Choose your weight</h2>
            <button 
              onClick={() => setShowWeightModal(false)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close weight selection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6 space-y-8 overflow-y-auto">
            {/* Current Weight Display - Large and Prominent */}
            <div className="text-center py-8 bg-gray-800 rounded-2xl border-2 border-gray-600">
              <div className="text-4xl font-bold text-text-primary mb-2">
                {tempWeight} lbs
              </div>
              <div className="text-lg text-text-secondary">Your Weight</div>
            </div>
            
            {/* Weight Slider */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-text-primary">
                Weight: {tempWeight} lbs
                {(formData.boxingWeightClass || formData.mmaWeightClass) && (
                  <span className="block text-sm text-text-secondary font-normal">
                    {(formData.boxingWeightClass || formData.mmaWeightClass)} range: {getWeightLimits().min}-{getWeightLimits().max} lbs
                  </span>
                )}
              </label>
              <div className="px-4">
                <input
                  type="range"
                  min={getWeightLimits().min}
                  max={getWeightLimits().max}
                  value={Math.max(getWeightLimits().min, Math.min(getWeightLimits().max, tempWeight))}
                  onChange={(e) => setTempWeight(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((tempWeight - getWeightLimits().min) / (getWeightLimits().max - getWeightLimits().min)) * 100}%, #e5e7eb ${((tempWeight - getWeightLimits().min) / (getWeightLimits().max - getWeightLimits().min)) * 100}%, #e5e7eb 100%)`
                  }}
                  aria-label={`Weight: ${tempWeight} lbs`}
                />
              </div>
              <div className="flex justify-between text-sm text-text-secondary px-4">
                <span>{getWeightLimits().min} lbs</span>
                <span>{getWeightLimits().max} lbs</span>
              </div>
            </div>
            
            {/* Weight Class Information */}
            {(formData.boxingWeightClass || formData.mmaWeightClass) ? (
              <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-600">
                <h3 className="text-lg font-semibold text-blue-300 mb-3">Selected Weight Class</h3>
                <div className="text-blue-200">
                  <div className="font-semibold text-blue-100">{formData.boxingWeightClass || formData.mmaWeightClass}</div>
                  <div className="text-sm mt-1">
                    Range: {getWeightLimits().min}-{getWeightLimits().max} lbs
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-600">
                <h3 className="text-lg font-semibold text-yellow-300 mb-3">Weight Class Required</h3>
                <div className="text-yellow-200 text-sm">
                  Please select a weight class from your fighting sport(s) first to see the appropriate weight range.
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-600 bg-background">
            <button
              onClick={() => {
                setFormData(prev => ({ 
                  ...prev, 
                  weight: `${tempWeight}lbs` 
                }));
                setShowWeightModal(false);
              }}
              className="w-full bg-button-red text-white py-4 rounded-xl font-semibold text-lg hover:bg-button-red-hover transition-colors shadow-lg"
              aria-label={`Save weight ${tempWeight} lbs`}
            >
              Save Weight
            </button>
          </div>
        </div>
      )}

      {/* Boxing Weight Class Modal - Full Screen Takeover - Dark Theme */}
      {showBoxingWeightModal && (
        <div 
          className="fixed inset-0 bg-background z-50 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBoxingWeightModal(false);
            }
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-600 bg-background">
            <h2 className="text-xl font-semibold text-text-primary">Boxing Weight Class</h2>
            <button 
              onClick={() => setShowBoxingWeightModal(false)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close boxing weight class selection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="text-center py-4 bg-gray-800 rounded-xl border border-gray-600 mb-6">
                <div className="text-lg font-semibold text-text-primary mb-2">Boxing (men's professional)</div>
                <div className="text-sm text-text-secondary">Select your weight class</div>
              </div>
              
              <div className="space-y-2">
                {boxingWeightClasses.map((weightClass, index) => (
                  <div
                    key={index}
                    onClick={() => setTempBoxingWeightClass(weightClass.name)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      tempBoxingWeightClass === weightClass.name
                        ? 'border-button-red bg-red-900/20'
                        : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-text-primary">{weightClass.name}</div>
                        <div className="text-sm text-text-secondary">{weightClass.range}</div>
                      </div>
                      {tempBoxingWeightClass === weightClass.name && (
                        <div className="w-6 h-6 bg-button-red rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-600 bg-background">
            <button 
              onClick={saveBoxingWeightClass}
              className="w-full bg-button-red text-white py-4 rounded-xl font-semibold text-lg hover:bg-button-red-hover transition-colors shadow-lg"
              aria-label="Save boxing weight class"
            >
              Save Weight Class
            </button>
          </div>
        </div>
      )}

      {/* MMA Weight Class Modal - Full Screen Takeover - Dark Theme */}
      {showMMAWeightModal && (
        <div 
          className="fixed inset-0 bg-background z-50 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMMAWeightModal(false);
            }
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-600 bg-background">
            <h2 className="text-xl font-semibold text-text-primary">MMA Weight Class</h2>
            <button 
              onClick={() => setShowMMAWeightModal(false)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close MMA weight class selection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="text-center py-4 bg-gray-800 rounded-xl border border-gray-600 mb-6">
                <div className="text-lg font-semibold text-text-primary mb-2">MMA (men's professional)</div>
                <div className="text-sm text-text-secondary">Select your weight class</div>
              </div>
              
              <div className="space-y-2">
                {mmaWeightClasses.map((weightClass, index) => (
                  <div
                    key={index}
                    onClick={() => setTempMMAWeightClass(weightClass.name)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      tempMMAWeightClass === weightClass.name
                        ? 'border-button-red bg-red-900/20'
                        : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-text-primary">{weightClass.name}</div>
                        <div className="text-sm text-text-secondary">{weightClass.range}</div>
                      </div>
                      {tempMMAWeightClass === weightClass.name && (
                        <div className="w-6 h-6 bg-button-red rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-600 bg-background">
            <button 
              onClick={saveMMAWeightClass}
              className="w-full bg-button-red text-white py-4 rounded-xl font-semibold text-lg hover:bg-button-red-hover transition-colors shadow-lg"
              aria-label="Save MMA weight class"
            >
              Save Weight Class
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
