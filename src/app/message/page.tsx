"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MessagePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new messaging structure
    router.replace("/messages");
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-red mx-auto mb-4"></div>
        <p className="text-text-secondary">Redirecting to messages...</p>
      </div>
    </div>
  );
}
