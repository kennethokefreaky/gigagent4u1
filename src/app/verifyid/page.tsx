"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function VerifyIDContent() {
  const router = useRouter();
  const params = useSearchParams();
  const country = params?.get("country") || "United States";
  const rolesParam = params?.get("roles") || "";
  const name = params?.get("name") || "User";

  const [idOptions, setIdOptions] = useState<string[]>([]);
  const [isAthleticRole, setIsAthleticRole] = useState(false);

  useEffect(() => {
    const roles = rolesParam.split(",").filter(role => role.trim() !== "");
    const options: string[] = [];

    // Debug: Log the roles being processed
    console.log("VerifyID - Raw rolesParam:", rolesParam);
    console.log("VerifyID - Parsed roles:", roles);

    // Check if user is an athletic role
    const athleticCheck = roles.includes("Wrestler") || roles.includes("Boxer") || roles.includes("MMA");
    setIsAthleticRole(athleticCheck);
    console.log("VerifyID - Athletic check result:", athleticCheck, "for roles:", roles);

    // Base options
    options.push("State ID", "Passport");

    // Athletic License for Wrestlers, Boxers, and MMA (replaces Driver License)
    if (athleticCheck) {
      options.unshift("Athletic License");
      console.log("VerifyID - Added Athletic License for:", roles.filter(r => ["Wrestler", "Boxer", "MMA"].includes(r)));
    } else {
      // Driver License for non-athletic roles
      options.unshift("Driver License");
      console.log("VerifyID - Added Driver License for non-athletic roles");
    }

    // Business license for promoters
    if (roles.includes("Promoter")) {
      options.unshift("Business License");
      console.log("Added Business License for Promoter");
    }

    // Remove duplicates
    const finalOptions = [...new Set(options)];
    console.log("Final ID options:", finalOptions);
    setIdOptions(finalOptions);
  }, [rolesParam]);

  const handleSkip = async () => {
    try {
      // Save to localStorage
      console.log('VerifyID: User clicked skip button - setting verificationSkipped = true');
      localStorage.setItem('verificationSkipped', 'true');
      
      // Verify it was set
      const checkValue = localStorage.getItem('verificationSkipped');
      console.log('VerifyID: verificationSkipped set to:', checkValue);
      
      // Determine the primary role for location page
      let primaryRole = "Talent"; // Default
      if (rolesParam) {
        const roleList = rolesParam.split(",").filter(role => role.trim() !== "");
        if (roleList.includes("Promoter")) {
          primaryRole = "Promoter";
        } else if (roleList.length > 0) {
          // If it's a specific talent category, still use "Talent"
          primaryRole = "Talent";
        }
      }
      
      console.log('VerifyID: Navigating to location page with role:', primaryRole);
      // Navigate to location page after skipping verification
      router.push(`/location?role=${encodeURIComponent(primaryRole)}`);
    } catch (error) {
      console.error('Error in handleSkip:', error);
      // Fallback to localStorage
      localStorage.setItem('verificationSkipped', 'true');
      
      // Determine the primary role for location page
      let primaryRole = "Talent"; // Default
      if (rolesParam) {
        const roleList = rolesParam.split(",").filter(role => role.trim() !== "");
        if (roleList.includes("Promoter")) {
          primaryRole = "Promoter";
        } else if (roleList.length > 0) {
          primaryRole = "Talent";
        }
      }
      
      router.push(`/location?role=${encodeURIComponent(primaryRole)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header with Back and Skip buttons */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/governid" className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          
          {/* Skip button - show for all roles */}
          <button 
            onClick={handleSkip}
            className="text-button-red hover:text-button-red-hover transition-colors font-medium"
          >
            Skip
          </button>
        </div>

        {/* Main heading */}
        <h1 className="text-heading text-text-primary mb-4">We need to verify you</h1>

        {/* Description */}
        <p className="text-body text-text-secondary mb-6">
          {isAthleticRole ? (
            <>
              This verification is optional. We require a photo of a government ID to verify your identity in{" "}
              <span className="text-text-primary font-semibold">{country}</span>.
              <br /><br />
              <span className="text-button-red font-semibold">Wrestlers, boxers, and MMA fighters:</span> Please choose{" "}
              <span className="text-text-primary font-semibold">Athletic License</span> as your verification option.
              <br /><br />
              If you do not have it now, press the <span className="text-button-red font-semibold">Skip</span> button.
            </>
          ) : (
            <>
              This verification is optional. We require a photo of a government ID to verify your identity in{" "}
              <span className="text-text-primary font-semibold">{country}</span>.
            </>
          )}
        </p>

        {/* Subheading */}
        <p className="text-body text-text-secondary mb-6">Choose 1 of the following options</p>

        {/* ID Options */}
        <div className="space-y-3 mb-8">
          {idOptions.map((option) => (
            <button
              key={option}
              onClick={() => {
                // All IDs go to chooseverify page
                router.push(`/chooseverify?idType=${encodeURIComponent(option)}&country=${encodeURIComponent(country)}&roles=${encodeURIComponent(rolesParam)}&name=${encodeURIComponent(name)}`);
              }}
              className="w-full flex justify-between items-center px-4 py-4 radius-md bg-input-background hover:bg-surface text-left border border-transparent hover:border-text-secondary transition-colors"
            >
              <div className="flex items-center flex-1">
                {/* Icon based on option type */}
                <div className="w-8 h-8 bg-button-red opacity-20 radius-md flex items-center justify-center mr-3">
                  {option === "Driver License" || option === "State ID" ? (
                    <svg className="w-4 h-4 text-button-red" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v2h16V6H4zm0 4v6h16v-6H4z"/>
                    </svg>
                  ) : option === "Passport" ? (
                    <svg className="w-4 h-4 text-button-red" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  ) : option === "Business License" ? (
                    <svg className="w-4 h-4 text-button-red" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                  ) : option === "Athletic License" ? (
                    <svg className="w-4 h-4 text-button-red" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-button-red" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-text-primary text-body font-medium">{option}</span>
                  {option === "Athletic License" && (
                    <p className="text-text-secondary text-caption mt-1">
                      Required for MMA fighters, boxers, and wrestlers
                    </p>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VerifyID() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <VerifyIDContent />
    </Suspense>
  );
}
