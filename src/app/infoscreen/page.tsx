"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function InfoScreenContent() {
  const router = useRouter();
  const params = useSearchParams();
  const roles = params.get("roles") || "";
  const name = params.get("name") || "User";
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Back button */}
        <div className="mb-6 text-left">
          <button 
            onClick={() => router.push(`/question?name=${encodeURIComponent(name)}`)}
            className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        {/* Logo placeholder - you can add your logo here */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-button-red rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">GA4U</span>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-heading text-text-primary mb-6">
          We need some information
        </h1>

        {/* Description */}
        <p className="text-body text-text-secondary mb-8 leading-relaxed">
          To help us confirm your identity and keep our community safe, we&apos;ll
          need to verify your government ID or athletic license if you&apos;re an MMA fighter, boxer, or wrestler. 
          If you&apos;re not in these categories, government ID verification is optional for you. 
          Your information will be securely processed and never shared publicly.
        </p>

        {/* License image */}
        <div className="mb-8 flex justify-center">
          <img
            src="/license.png"
            alt="License verification"
            className="w-64 h-40 object-contain"
          />
        </div>

        {/* Get Started button */}
        <Link href={{ pathname: "/governid", query: { roles, name } }}>
          <button className="w-full bg-button-red text-white py-4 radius-md font-semibold hover:bg-button-red-hover transition-colors">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function InfoScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <InfoScreenContent />
    </Suspense>
  );
}
