"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OfflineRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleOffline = () => {
      router.replace("/offline-play");
    };

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, [router]);

  return null;
}
