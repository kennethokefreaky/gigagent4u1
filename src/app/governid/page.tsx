"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const countries = [
  "United States",
  "United Kingdom",
  "Australia",
  "Mexico",
  "Canada",
  "India"
];

function GovernIDContent() {
  const params = useSearchParams();
  const roles = params.get("roles") || "";
  const name = params.get("name") || "User";
  const [selected, setSelected] = useState("United States");
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCountries = countries.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/infoscreen" className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        {/* Main heading */}
        <h1 className="text-heading text-text-primary mb-4">
          What country is your government ID from?
        </h1>

        {/* Description */}
        <p className="text-body text-text-secondary mb-8">
          This helps us determine the best way to verify your identity.
        </p>

        {/* Country selector */}
        <div className="mb-8">
          <div
            className="w-full p-4 radius-md bg-input-background text-text-primary border border-text-secondary hover:border-button-red transition-colors cursor-pointer flex items-center justify-between"
            onClick={() => setShowCountrySheet(true)}
          >
            <span>{selected}</span>
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Continue button */}
        <Link href={{ pathname: "/verifyid", query: { country: selected, roles, name } }}>
          <button className="w-full bg-button-red text-white py-4 radius-md font-semibold hover:bg-button-red-hover transition-colors">
            Continue
          </button>
        </Link>
      </div>

      {/* Country bottom sheet */}
      {showCountrySheet && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCountrySheet(false);
              setSearch("");
            }
          }}
        >
          <div className="w-full bg-background rounded-t-2xl p-6 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-subheading text-text-primary">Select Country</h2>
              <button
                onClick={() => {
                  setShowCountrySheet(false);
                  setSearch("");
                }}
                className="p-2 hover:bg-surface rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search input */}
            <div className="mb-6 sticky top-0 bg-background pb-2 z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-4 pl-12 radius-md bg-input-background text-text-primary border border-text-secondary focus:border-button-red transition-colors outline-none"
                  autoComplete="off"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Country list */}
            <div className="space-y-2 pb-4">
              {filteredCountries.map((country) => (
                <div
                  key={country}
                  className={`p-4 radius-md cursor-pointer transition-colors ${
                    selected === country
                      ? "bg-button-red text-white"
                      : "bg-input-background text-text-primary hover:bg-surface"
                  }`}
                  onClick={() => {
                    setSelected(country);
                    setShowCountrySheet(false);
                    setSearch("");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-body font-medium">{country}</span>
                    {selected === country && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* No results */}
            {filteredCountries.length === 0 && (
              <div className="text-center py-8">
                <p className="text-text-secondary">No countries found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GovernID() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-primary">Loading...</div></div>}>
      <GovernIDContent />
    </Suspense>
  );
}
