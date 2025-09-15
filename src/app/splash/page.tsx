"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    // Show logo for 2 seconds, then navigate directly
    const timer = setTimeout(() => {
      router.push("/paymentwall");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen bg-background items-center justify-center">
      <img
        src="/GA4U.png"
        alt="GA4U Logo"
        className="w-40 h-40 animate-fadeIn"
      />
    </div>
  );
}
