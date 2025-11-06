"use client";

import { useState, useEffect } from "react";
import HomeHeader from "../components/HomeHeader";
import GoalSection from "../components/GoalSection";
import Tabs from "../components/Tabs";
import FloatingButton from "../components/FloatingButton";
import Navigation from "../components/Navigation";
import { checkAndCreateMealTimeNotification } from "../../utils/mealTimeNotifications";

export default function GigAgent4UPage() {
  const [userType, setUserType] = useState<string>(""); // Start with empty string
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state

  useEffect(() => {
    // Get user type from Supabase profile
    const getUserTypeFromSupabase = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('GigAgent4U: No authenticated user found');
          return;
        }

        // Get user profile from Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.log('GigAgent4U: No profile found, using default promoter');
          setUserType('promoter');
          setIsLoading(false);
          return;
        }

        console.log('GigAgent4U: User type from Supabase =', profile.role);
        setUserType(profile.role || 'promoter');
        setIsLoading(false);
      } catch (error) {
        console.error('GigAgent4U: Error fetching user type:', error);
        // Use default promoter if Supabase fails
        setUserType('promoter');
        setIsLoading(false);
      }
    };

    getUserTypeFromSupabase();

    // Check for meal-time notifications when user lands on gigagent4u
    const checkMealNotifications = async () => {
      try {
        console.log('🍽️ GigAgent4U: Checking meal-time notifications...');
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('❌ GigAgent4U: No authenticated user found - skipping meal notifications');
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

  // Show loading screen while determining user type
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-text-primary">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-red mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

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
