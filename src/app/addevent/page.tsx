"use client";

import { useRouter } from "next/navigation";

export default function AddEventPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/gigagent4u");
  };

  const handleCreateManually = () => {
    router.push("/create");
  };

  // const handleImportYelp = () => {
  //   router.push("/import/yelp");
  // };


  const handleImportEventbrite = () => {
    router.push("/import/eventbrite");
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-text-secondary">
        <button
          onClick={handleClose}
          className="p-2 hover:bg-surface rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-heading font-bold text-center flex-1 mr-10">
          Create an Event
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Create Manually Button */}
        <div className="space-y-2">
          <button
            onClick={handleCreateManually}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-4 px-6 rounded-xl font-semibold transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Manually
          </button>
          <p className="text-text-secondary text-sm px-2">
            Best for adding custom gigs with your own details.
          </p>
        </div>

        {/* Import Yelp Events Button */}
        {/* <div className="space-y-2">
          <button
            onClick={handleImportYelp}
            className="w-full bg-[#FF2C2C] hover:bg-[#E02525] text-white py-4 px-6 rounded-xl font-semibold transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Import Yelp Events
          </button>
          <p className="text-text-secondary text-sm px-2">
            Great for nightlife, comedy, and local events.
          </p>
        </div> */}


        {/* Import Eventbrite Events Button */}
        <div className="space-y-2">
          <button
            onClick={handleImportEventbrite}
            className="w-full bg-[#FB8C00] hover:bg-[#E65100] text-white py-4 px-6 rounded-xl font-semibold transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Import Eventbrite Events
          </button>
          <p className="text-text-secondary text-sm px-2">
            Perfect for conferences and professional gigs.
          </p>
        </div>
      </div>
    </div>
  );
}
