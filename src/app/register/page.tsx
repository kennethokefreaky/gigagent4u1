"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleRegister = () => {
    // For demo purposes, redirect to question page with name
    // In a real app, this would handle registration
    router.push(`/question?name=${encodeURIComponent(name || "User")}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Heading */}
        <h1 className="text-heading text-text-primary mb-6 text-center">
          Create an{"\n"}account
        </h1>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image 
            src="/GA4U.png" 
            alt="GA4U Logo" 
            width={120} 
            height={120}
            className="object-contain"
          />
        </div>

      {/* Username */}
      <div className="flex items-center bg-input-background radius-md mb-4 px-3">
        <svg className="w-5 h-5 text-input-icon mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <input
          type="text"
          placeholder="Username or Email"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-transparent text-text-primary py-3 outline-none placeholder-text-secondary"
        />
      </div>

      {/* Password */}
      <div className="flex items-center bg-input-background radius-md mb-2 px-3">
        <svg className="w-5 h-5 text-input-icon mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <input
          type="password"
          placeholder="Password"
          className="flex-1 bg-transparent text-text-primary py-3 outline-none placeholder-text-secondary"
        />
        <svg className="w-5 h-5 text-input-icon ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>

      {/* Confirm Password */}
      <div className="flex items-center bg-input-background radius-md mb-4 px-3">
        <svg className="w-5 h-5 text-input-icon mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <input
          type="password"
          placeholder="Confirm Password"
          className="flex-1 bg-transparent text-text-primary py-3 outline-none placeholder-text-secondary"
        />
        <svg className="w-5 h-5 text-input-icon ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>

      {/* Already Have Account */}
      <p className="text-center text-text-secondary mb-6">
        Already have an account?{" "}
        <Link href="/welcome" className="text-button-red font-semibold hover:underline">
          Sign in here
        </Link>
      </p>

      {/* Register Button */}
      <div className="flex items-center justify-between mb-10">
        <span className="text-text-primary text-subheading font-semibold">Register</span>
        <button 
          onClick={handleRegister}
          className="bg-button-red rounded-full p-4 hover:bg-button-red-hover transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Social Label */}
      <p className="text-center text-text-secondary text-caption mb-4">sign up with</p>

      {/* Social Buttons */}
      <div className="flex justify-center gap-4">
        <button className="w-12 h-12 rounded-full bg-social-google flex items-center justify-center hover:opacity-80 transition-opacity">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </button>
        <button className="w-12 h-12 rounded-full bg-social-facebook flex items-center justify-center hover:opacity-80 transition-opacity">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
            <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>
      </div>
      </div>

    </div>
  );
}