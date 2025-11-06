"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  role: 'talent' | 'promoter' | 'unverified';
  full_name?: string;
  talent_categories?: string[];
  promoter_types?: string[];
  verification_status: 'verified' | 'unverified' | 'skipped';
  location?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        console.log('UserContext: No authenticated user');
        setUser(null);
        setLoading(false);
        return;
      }

      // Get user profile from Supabase
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError || !profile) {
        console.log('UserContext: No profile found');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('UserContext: User profile loaded:', profile);
      setUser(profile);
    } catch (error) {
      console.error('UserContext: Error refreshing user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('UserContext: Error updating profile:', error);
        return false;
      }

      // Refresh user data
      await refreshUser();
      return true;
    } catch (error) {
      console.error('UserContext: Exception updating profile:', error);
      return false;
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('UserContext: Auth state changed:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, updateUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
