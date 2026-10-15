"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster, type ToastItem } from "./Toaster";

export const OFFLINE_PATH = "/offline-play";
export const RETURN_PATH_KEY = "catchmusic_return_path";
const APP_CACHE = "catchmusic-app-v1";

interface ConnectivityContextType {
  isOnline: boolean;
  /** Where the "Back to app" button should take the user. */
  getReturnPath: () => string;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  getReturnPath: () => "/home",
});

export const useConnectivity = () => useContext(ConnectivityContext);

/**
 * Pre-caches the offline page's JS/CSS chunks so the page can actually render
 * with no network (the service worker only caches assets it has already seen).
 */
async function warmOfflineAssets() {
  try {
    if (!("caches" in window)) return;
    const res = await fetch(OFFLINE_PATH, { cache: "reload" });
    if (!res.ok) return;
    const html = await res.clone().text();
    const cache = await caches.open(APP_CACHE);
    await cache.put(OFFLINE_PATH, res);

    const assets = new Set<string>();
    const re = /(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) if (m[1]) assets.add(m[1]);

    await Promise.all(
      [...assets].map(async (url) => {
        if (await cache.match(url)) return;
        const r = await fetch(url);
        if (r.ok) await cache.put(url, r);
      })
    );
  } catch (err) {
    console.warn("[Offline] Could not warm offline assets:", err);
  }
}

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pathRef = useRef(pathname);
  const mounted = useRef(false);

  useEffect(() => {
    pathRef.current = pathname;
    // Remember the last "real" page so the offline page can send the user back.
    if (pathname && pathname !== OFFLINE_PATH) {
      try {
        sessionStorage.setItem(RETURN_PATH_KEY, pathname);
      } catch {}
    }
  }, [pathname]);

  const getReturnPath = useCallback(() => {
    try {
      return sessionStorage.getItem(RETURN_PATH_KEY) || "/home";
    } catch {
      return "/home";
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastItem) => {
    // Only one connectivity toast at a time: the newest status wins.
    setToasts([toast]);
  }, []);

  const goOffline = useCallback(() => {
    setIsOnline(false);
    pushToast({
      id: "offline",
      variant: "offline",
      title: "You're offline",
      message: "No worries — your downloaded songs are ready to play.",
      duration: 6000,
    });
    if (pathRef.current !== OFFLINE_PATH) router.replace(OFFLINE_PATH);
  }, [pushToast, router]);

  const goOnline = useCallback(() => {
    setIsOnline(true);
    const onOfflinePage = pathRef.current === OFFLINE_PATH;
    pushToast({
      id: "online",
      variant: "online",
      title: "Back online",
      message: onOfflinePage
        ? "Your connection is restored. Jump back to the full app?"
        : "Your connection is restored.",
      duration: 7000,
      action: onOfflinePage
        ? { label: "Back to app", onClick: () => router.push(getReturnPath()) }
        : undefined,
    });
    warmOfflineAssets();
  }, [getReturnPath, pushToast, router]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    // Initial state (no toast for a normal online load).
    if (!navigator.onLine) {
      goOffline();
    } else {
      setIsOnline(true);
      router.prefetch(OFFLINE_PATH);
      // Wait for the service worker, then warm the offline page.
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then(warmOfflineAssets).catch(() => {});
      }
    }
  }, [goOffline, router]);

  useEffect(() => {
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [goOffline, goOnline]);

  const value = useMemo(() => ({ isOnline, getReturnPath }), [isOnline, getReturnPath]);

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ConnectivityContext.Provider>
  );
}

export default ConnectivityProvider;
