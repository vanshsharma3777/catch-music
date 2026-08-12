"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.log(
        "[ServiceWorker] Not supported"
      );

      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "[ServiceWorker] Registered:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "[ServiceWorker] Registration failed:",
          error
        );
      });
  }, []);

  return null;
}
