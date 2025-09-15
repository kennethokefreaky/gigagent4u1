"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentWall() {
  const [plan, setPlan] = useState("yearly");
  const router = useRouter();

  const handleContinue = () => {
    router.push("/welcome");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-heading text-text-primary">GA4U Premium</h1>
        <button className="w-8 h-8 flex items-center justify-center">
          <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Features List */}
      <div className="mb-8">
        <p className="text-body text-text-secondary mb-4">
          Streak, Workout Suggestions, Health Summary, Mirror Tracking, Add Workout with RPE, Statuses, Overview Charts, Sneak-Peek, Insights, Profile Customization.
        </p>
      </div>

      {/* Yearly */}
      <div
        className={`w-full border radius-md p-4 mb-4 cursor-pointer relative ${
          plan === "yearly"
            ? "border-button-red bg-surface"
            : "border-text-secondary bg-surface"
        }`}
        onClick={() => setPlan("yearly")}
      >
        {/* For You 50% OFF Banner */}
        <div className="absolute -top-2 -right-2 bg-button-red text-white text-xs px-2 py-1 rounded-full">
          For You 50% OFF
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* Radio Button */}
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              plan === "yearly" ? "border-button-red bg-button-red" : "border-text-secondary"
            }`}>
              {plan === "yearly" && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary">Yearly</p>
              <p className="text-sm text-text-secondary">Includes Family Sharing</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-text-primary">$24.99/year</p>
            <p className="line-through text-text-secondary">$49.99/year</p>
          </div>
        </div>
      </div>

      {/* Monthly */}
      <div
        className={`w-full border radius-md p-4 mb-4 cursor-pointer ${
          plan === "monthly"
            ? "border-button-red bg-surface"
            : "border-text-secondary bg-surface"
        }`}
        onClick={() => setPlan("monthly")}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* Radio Button */}
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              plan === "monthly" ? "border-button-red bg-button-red" : "border-text-secondary"
            }`}>
              {plan === "monthly" && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <p className="font-semibold text-text-primary">Monthly</p>
          </div>
          <p className="font-semibold text-text-primary">$7.99/month</p>
        </div>
      </div>

      {/* Lifetime */}
      <div
        className={`w-full border radius-md p-4 mb-6 cursor-pointer ${
          plan === "lifetime"
            ? "border-button-red bg-surface"
            : "border-text-secondary bg-surface"
        }`}
        onClick={() => setPlan("lifetime")}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* Radio Button */}
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              plan === "lifetime" ? "border-button-red bg-button-red" : "border-text-secondary"
            }`}>
              {plan === "lifetime" && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary">Lifetime</p>
              <p className="text-sm text-text-secondary">Pay Once, Use Forever</p>
              <p className="text-sm text-text-secondary">Includes Family Sharing</p>
            </div>
          </div>
          <p className="font-semibold text-text-primary">$139.99</p>
        </div>
      </div>

      {/* Restore Purchase */}
      <div className="mb-6">
        <button className="text-button-red text-sm underline">
          Restore Purchase
        </button>
      </div>

      {/* Summary */}
      {plan === "yearly" && (
        <div className="mb-6 text-center">
          <p className="text-sm text-text-secondary">
            <span className="line-through">$49.99</span> <span className="text-text-primary font-semibold">$24.99/year</span> <span className="text-button-red">(50% OFF)</span>
          </p>
        </div>
      )}

      {/* Continue */}
      <button 
        onClick={handleContinue}
        className="w-full bg-button-red text-white py-4 radius-md font-semibold hover:bg-button-red-hover transition-colors"
      >
        Continue
      </button>

      {/* Cancel Anytime */}
      <div className="mt-4 text-center">
        <p className="text-sm text-text-secondary">Cancel Anytime</p>
      </div>

    </div>
  );
}
