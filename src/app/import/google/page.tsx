"use client";

import { useRouter } from "next/navigation";

export default function ImportGooglePage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/addevent");
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-text-secondary">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-surface rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-heading font-bold text-center flex-1 mr-10">
          Import Google Events
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 text-center">
        <div className="bg-surface rounded-xl p-8">
          <h2 className="text-subheading font-semibold mb-4">Coming Soon</h2>
          <p className="text-text-secondary mb-6">
            Google event import functionality will be available soon.
          </p>
          <button
            onClick={handleBack}
            className="bg-button-red hover:bg-button-red-hover text-white py-3 px-6 rounded-xl font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
