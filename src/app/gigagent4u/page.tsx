"use client";

import { useState, useEffect } from "react";
import HomeHeader from "../components/HomeHeader";
import GoalSection from "../components/GoalSection";
import Tabs from "../components/Tabs";
import FloatingButton from "../components/FloatingButton";
import Navigation from "../components/Navigation";
import { checkAndCreateMealTimeNotification } from "../../utils/mealTimeNotifications";

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

    // Check for meal-time notifications when user lands on gigagent4u
    const checkMealNotifications = async () => {
      try {
        console.log('🍽️ GigAgent4U: Checking meal-time notifications...');
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('❌ GigAgent4U: No authenticated user found');
          return;
        }

        console.log('✅ GigAgent4U: User authenticated:', user.id);
        await checkAndCreateMealTimeNotification(user.id);
        console.log('✅ GigAgent4U: Meal-time notification check completed');
      } catch (error) {
        console.error('❌ GigAgent4U: Error checking meal-time notifications:', error);
      }
    };

    checkMealNotifications();
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
