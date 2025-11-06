"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function QuestionPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const name = params?.get("name") || "User";
  const [role, setRole] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState<string>("");
  const [promoterTypes, setPromoterTypes] = useState<string[]>([]);
  const [customPromoterType, setCustomPromoterType] = useState<string>("");
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [showPromoterSheet, setShowPromoterSheet] = useState(false);
  const [showCustomPromoterSheet, setShowCustomPromoterSheet] = useState(false);
  const [search, setSearch] = useState("");
  const [promoterSearch, setPromoterSearch] = useState("");

  const categoryOptions = ["Wrestler", "Boxer", "MMA", "Comedy", "Musician", "Other"];
  const filtered = categoryOptions.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const promoterTypeOptions = ["Event Organizer", "Venue Manager", "Marketing Specialist", "Booking Agent", "Other"];
  const filteredPromoterTypes = promoterTypeOptions.filter(p =>
    p.toLowerCase().includes(promoterSearch.toLowerCase())
  );

  // Handle keyboard visibility for mobile devices
  useEffect(() => {
    const handleResize = () => {
      // Force viewport height recalculation on mobile
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const selectRole = (selectedRole: string) => {
    setRole(selectedRole);
    
    // Reset categories and promoter types when role changes
    setCategories([]);
    setCustomCategory("");
    setPromoterTypes([]);
    setCustomPromoterType("");
  };

  const toggleCategory = (categoryName: string) => {
    setCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(cat => cat !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  const togglePromoterType = (typeName: string) => {
    setPromoterTypes(prev => {
      if (prev.includes(typeName)) {
        return prev.filter(type => type !== typeName);
      } else {
        return [...prev, typeName];
      }
    });
  };

  // Check if all required selections are made
  const isFormValid = () => {
    // Must have a role selected
    if (!role) return false;
    
    // If Talent is selected, must have at least one category
    if (role === "Talent" && categories.length === 0) return false;
    
    // If Promoter is selected, must have at least one promoter type
    if (role === "Promoter" && promoterTypes.length === 0) return false;
    
    return true;
  };

  const handleContinue = async () => {
    // Check if all required selections are made
    if (isFormValid()) {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("No authenticated user:", authError);
          return;
        }

        // User type will be saved to Supabase profiles table
        const userType = role === "Talent" ? "talent" : "promoter";

        // Save role and categories to Supabase profiles table
        const updates: {
          role: string;
          updated_at: string;
          talent_categories?: string[];
          promoter_types?: string[];
        } = {
          role: userType,
          updated_at: new Date().toISOString(),
        };

        if (role === "Talent" && categories.length > 0) {
          updates.talent_categories = categories;
        } else if (role === "Promoter" && promoterTypes.length > 0) {
          updates.promoter_types = promoterTypes;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
        } else {
          console.log("Profile updated successfully");
        }
        
        // Navigate directly to verification flow with selected role and categories/types
        let rolesQuery = "";
        
        if (role === "Talent" && categories.length > 0) {
          // Pass all selected categories as comma-separated string
          rolesQuery = categories.join(",");
        } else if (role === "Promoter" && promoterTypes.length > 0) {
          // Keep as "Promoter" for business license
          rolesQuery = "Promoter";
        }
        
        router.push(`/infoscreen?roles=${rolesQuery}&name=${encodeURIComponent(name)}`);
      } catch (error) {
        console.error('Error in handleContinue:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Heading */}
        <h1 className="text-heading text-text-primary mb-6 text-center">
          Let&apos;s set up your profile
        </h1>

        {/* Subheading */}
        <p className="text-body text-text-secondary mb-8 text-center">
          Which role fits you best?
        </p>

        {/* Options */}
        <div className="space-y-4 mb-8">
          <div
            className={`flex items-center px-4 py-4 radius-md cursor-pointer border transition-colors ${
              role === "Talent"
                ? "border-button-red bg-surface"
                : "border-text-secondary bg-input-background hover:bg-surface"
            }`}
            onClick={() => selectRole("Talent")}
          >
            {/* Custom Radio Button */}
            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
              role === "Talent" ? "border-button-red bg-button-red" : "border-text-secondary"
            }`}>
              {role === "Talent" && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <span className="text-text-primary text-body font-medium">Talent</span>
          </div>

          <div
            className={`flex items-center px-4 py-4 radius-md cursor-pointer border transition-colors ${
              role === "Promoter"
                ? "border-button-red bg-surface"
                : "border-text-secondary bg-input-background hover:bg-surface"
            }`}
            onClick={() => selectRole("Promoter")}
          >
            {/* Custom Radio Button */}
            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
              role === "Promoter" ? "border-button-red bg-button-red" : "border-text-secondary"
            }`}>
              {role === "Promoter" && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <span className="text-text-primary text-body font-medium">Promoter</span>
          </div>
        </div>

        {/* Promoter section (only if Promoter selected) */}
        {role === "Promoter" && (
          <div className="mb-8">
            <p className="text-body text-text-secondary mb-4">Tell us what you do?</p>
            <div
              className="border border-dashed border-text-secondary radius-md py-4 px-4 cursor-pointer text-text-secondary hover:border-button-red transition-colors"
              onClick={() => setShowPromoterSheet(true)}
            >
              {promoterTypes.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {promoterTypes.map((type) => (
                    <span key={type} className="bg-input-background text-text-primary px-3 py-2 radius-md text-sm">
                      {type === "Other" && customPromoterType ? customPromoterType : type}
                    </span>
                  ))}
                  <span className="text-text-secondary">+ Add type</span>
                </div>
              ) : (
                "+ Add type"
              )}
            </div>
          </div>
        )}

        {/* Optional custom promoter type */}
        {role === "Promoter" && promoterTypes.includes("Other") && (
          <div className="mb-8">
            <p className="text-body text-text-secondary mb-4">Tell us what you do (optional)</p>
            <div
              className="border border-dashed border-text-secondary radius-md py-4 px-4 cursor-pointer text-text-secondary hover:border-button-red transition-colors"
              onClick={() => setShowCustomPromoterSheet(true)}
            >
              {customPromoterType || "Type your role"}
            </div>
          </div>
        )}

        {/* Category section (only if Talent selected) */}
        {role === "Talent" && (
          <div className="mb-8">
            <p className="text-body text-text-secondary mb-4">Select your Categories</p>
            <div
              className="border border-dashed border-text-secondary radius-md py-4 px-4 cursor-pointer text-text-secondary hover:border-button-red transition-colors"
              onClick={() => setShowCategorySheet(true)}
            >
              {categories.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((cat) => (
                    <span key={cat} className="bg-input-background text-text-primary px-3 py-2 radius-md text-sm">
                      {cat === "Other" && customCategory ? customCategory : cat}
                    </span>
                  ))}
                  <span className="text-text-secondary">+ Add category</span>
                </div>
              ) : (
                "+ Add category"
              )}
            </div>
          </div>
        )}

        {/* Optional custom category */}
        {role === "Talent" && categories.includes("Other") && (
          <div className="mb-8">
            <p className="text-body text-text-secondary mb-4">Tell us your category (optional)</p>
            <div
              className="border border-dashed border-text-secondary radius-md py-4 px-4 cursor-pointer text-text-secondary hover:border-button-red transition-colors"
              onClick={() => setShowCustomSheet(true)}
            >
              {customCategory || "Type your category"}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!isFormValid()}
          className={`w-full py-4 radius-md font-semibold transition-colors ${
            !isFormValid()
              ? "bg-text-secondary text-background cursor-not-allowed opacity-50"
              : "bg-button-red text-white hover:bg-button-red-hover"
          }`}
        >
          Continue
        </button>

      </div>

      {/* Category bottom sheet */}
      {showCategorySheet && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-end z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategorySheet(false);
              setSearch("");
            }
          }}
        >
          <div className="w-full bg-background rounded-t-2xl p-6 bottom-sheet overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-subheading text-text-primary">Category</h2>
              <button 
                onClick={() => setShowCategorySheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full mb-6 px-4 py-3 radius-md bg-input-background text-text-primary placeholder-text-secondary outline-none border border-text-secondary focus:border-button-red transition-colors"
            />
            <div className="space-y-4 pb-4">
              {filtered.map(c => (
                <div
                  key={c}
                  className="flex items-center justify-between cursor-pointer px-2 py-2 hover:bg-surface radius-md transition-colors"
                  onClick={() => {
                    toggleCategory(c);
                    setSearch("");
                  }}
                >
                  <span className="text-text-primary text-body">{c}</span>
                  {categories.includes(c) && (
                    <div className="w-5 h-5 rounded-full border-2 border-button-red flex items-center justify-center">
                      <div className="w-2 h-2 bg-button-red rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom category bottom sheet */}
      {showCustomSheet && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-end z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCustomSheet(false);
            }
          }}
        >
          <div className="w-full bg-background rounded-t-2xl p-6 bottom-sheet">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-subheading text-text-primary">Tell us your category</h2>
              <button 
                onClick={() => setShowCustomSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            <div className="pb-4">
              <input
                type="text"
                placeholder="Type your category"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="w-full px-4 py-3 radius-md bg-input-background text-text-primary placeholder-text-secondary outline-none border border-text-secondary focus:border-button-red transition-colors"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Promoter type bottom sheet */}
      {showPromoterSheet && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-end z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPromoterSheet(false);
              setPromoterSearch("");
            }
          }}
        >
          <div className="w-full bg-background rounded-t-2xl p-6 bottom-sheet overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-subheading text-text-primary">What you do</h2>
              <button 
                onClick={() => setShowPromoterSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            <input
              type="text"
              placeholder="Search roles..."
              value={promoterSearch}
              onChange={e => setPromoterSearch(e.target.value)}
              className="w-full mb-6 px-4 py-3 radius-md bg-input-background text-text-primary placeholder-text-secondary outline-none border border-text-secondary focus:border-button-red transition-colors"
            />
            <div className="space-y-4 pb-4">
              {filteredPromoterTypes.map(p => (
                <div
                  key={p}
                  className="flex items-center justify-between cursor-pointer px-2 py-2 hover:bg-surface radius-md transition-colors"
                  onClick={() => {
                    togglePromoterType(p);
                    setPromoterSearch("");
                  }}
                >
                  <span className="text-text-primary text-body">{p}</span>
                  {promoterTypes.includes(p) && (
                    <div className="w-5 h-5 rounded-full border-2 border-button-red flex items-center justify-center">
                      <div className="w-2 h-2 bg-button-red rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom promoter type bottom sheet */}
      {showCustomPromoterSheet && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-end z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCustomPromoterSheet(false);
            }
          }}
        >
          <div className="w-full bg-background rounded-t-2xl p-6 bottom-sheet">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-subheading text-text-primary">Tell us what you do</h2>
              <button 
                onClick={() => setShowCustomPromoterSheet(false)}
                className="text-button-red font-semibold"
              >
                Done
              </button>
            </div>
            <div className="pb-4">
              <input
                type="text"
                placeholder="Type your role"
                value={customPromoterType}
                onChange={e => setCustomPromoterType(e.target.value)}
                className="w-full px-4 py-3 radius-md bg-input-background text-text-primary placeholder-text-secondary outline-none border border-text-secondary focus:border-button-red transition-colors"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <QuestionPageContent />
    </Suspense>
  );
}
