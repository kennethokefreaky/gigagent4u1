"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentWall() {
  const [plan, setPlan] = useState("monthly");
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
          Connect with promoters to showcase your talent, or if you're a promoter, connect with talent of all skills for your events. Access exclusive opportunities, direct messaging, and premium features.
        </p>
      </div>


      {/* Monthly */}
      <div
        className={`w-full border radius-md p-4 mb-4 cursor-pointer relative ${
          plan === "monthly"
            ? "border-button-red bg-surface"
            : "border-text-secondary bg-surface"
        }`}
        onClick={() => setPlan("monthly")}
      >
        {/* Most Popular Banner */}
        <div className="absolute -top-2 -right-2 bg-button-red text-white text-xs px-2 py-1 rounded-full">
          Most Popular
        </div>
        
        <div className="flex justify-between items-start sm:items-center">
          <div className="flex items-center flex-1 min-w-0">
            {/* Radio Button */}
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
              plan === "monthly" ? "border-button-red bg-button-red" : "border-text-secondary"
            }`}>
              {plan === "monthly" && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">Monthly</p>
              <p className="text-sm text-text-secondary">Best value for regular users</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <p className="font-semibold text-text-primary text-sm sm:text-base whitespace-nowrap">$12.99/month</p>
            <p className="text-sm text-text-secondary">Cancel anytime</p>
          </div>
        </div>
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
        {/* Save over 10% Banner */}
        <div className="absolute -top-2 -right-2 bg-button-red text-white text-xs px-2 py-1 rounded-full">
          Save over 10%
        </div>
        
        <div className="flex justify-between items-start sm:items-center">
          <div className="flex items-center flex-1 min-w-0">
            {/* Radio Button */}
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
              plan === "yearly" ? "border-button-red bg-button-red" : "border-text-secondary"
            }`}>
              {plan === "yearly" && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">Yearly</p>
              <p className="text-sm text-text-secondary">Best value for committed users</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <p className="font-semibold text-text-primary text-sm sm:text-base whitespace-nowrap">$135.99/year</p>
            <p className="line-through text-text-secondary text-xs sm:text-sm">$155.99/year</p>
          </div>
        </div>
      </div>



      {/* Summary */}
      {plan === "yearly" && (
        <div className="mb-6 text-center">
          <p className="text-sm text-text-secondary">
            <span className="text-button-red">15 days free then</span> <span className="text-text-primary font-semibold">$135.99</span>
          </p>
        </div>
      )}
      {plan === "monthly" && (
        <div className="mb-6 text-center">
          <p className="text-sm text-text-secondary">
            <span className="text-button-red">15 days free then</span> <span className="text-text-primary font-semibold">$12.99</span>
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
