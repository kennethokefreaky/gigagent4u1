"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "../../contexts/NotificationContext";
import { useState, useEffect } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const [needsVerification, setNeedsVerification] = useState(false);

  // Check for verification requirements from Supabase
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('Navigation: No authenticated user - skipping verification check');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, talent_categories, verification_status')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          return;
        }

        // Check if user is a fighting sports talent who skipped verification
        if (profile.role === "talent" && profile.talent_categories && profile.verification_status === 'skipped') {
          const fightingSports = ['Boxer', 'MMA', 'Wrestler'];
          const hasFightingSports = profile.talent_categories.some((cat: string) => fightingSports.includes(cat));
          
          if (hasFightingSports) {
            setNeedsVerification(true);
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    checkVerificationStatus();
  }, []);


  const navItems = [
    { 
      name: "Home", 
      href: "/gigagent4u", 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: "Map", 
      href: "/map", 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    { 
      name: "Notifications", 
      href: "/notifications", 
      icon: (
        <div className="relative">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          {/* Badge with notification count or verification needed */}
          {(unreadCount > 0 || needsVerification) && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
              {unreadCount > 0 ? unreadCount : "!"}
            </span>
          )}
        </div>
      )
    },
    { 
      name: "Profile", 
      href: "/profile", 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <nav className="sticky bottom-0 z-40 flex justify-around bg-surface py-3 border-t border-text-secondary">
      {navItems.map((item) => (
        <Link key={item.name} href={item.href}>
          <div
            className={`flex flex-col items-center transition-colors ${
              pathname === item.href ? "text-button-red" : "text-text-secondary"
            }`}
          >
            <span className="mb-1">{item.icon}</span>
            <span className="text-caption">{item.name}</span>
          </div>
        </Link>
      ))}
    </nav>
  );
}
