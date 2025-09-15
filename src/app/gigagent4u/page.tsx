"use client";

import { useState, useEffect } from "react";
import HomeHeader from "../components/HomeHeader";
import GoalSection from "../components/GoalSection";
import Tabs from "../components/Tabs";
import FloatingButton from "../components/FloatingButton";
import Navigation from "../components/Navigation";

export default function GigAgent4UPage() {
  const [userType, setUserType] = useState<string>("promoter"); // Default to promoter

  useEffect(() => {
    // Read user type from localStorage
    const storedUserType = localStorage.getItem('userType');
    console.log('GigAgent4U: storedUserType =', storedUserType);
    if (storedUserType) {
      setUserType(storedUserType);
      console.log('GigAgent4U: userType set to =', storedUserType);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      {/* Main Content */}
      <div className="flex-1">
        <HomeHeader userType={userType} />
        <GoalSection userType={userType} />
        <Tabs userType={userType} />
      </div>

      {/* Floating Button - Only show for promoters */}
      {userType === "promoter" && <FloatingButton />}

      {/* Bottom Nav */}
      <Navigation />
    </div>
  );
}
