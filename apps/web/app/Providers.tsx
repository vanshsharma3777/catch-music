"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";
import { PlayerProvider, GlobalPlayer } from "../components/player";
import ConnectivityProvider from "../components/connectivity/ConnectivityProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        <ConnectivityProvider>
          <ServiceWorkerRegister />
          {children}
          <GlobalPlayer />
        </ConnectivityProvider>
      </PlayerProvider>
    </SessionProvider>
  );
}
