"use client";

import { useRouter } from "next/navigation";

export default function FloatingButton() {
  const router = useRouter();

  const handleCreateEvent = () => {
    router.push("/addevent");
  };

  return (
    <button
      onClick={handleCreateEvent}
      className="fixed bottom-20 right-4 w-14 h-14 bg-button-red rounded-full flex items-center justify-center shadow-lg hover:bg-button-red-hover transition-colors z-50"
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
