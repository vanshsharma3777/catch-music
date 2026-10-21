
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getToken, setToken } from "../lib/authStore";

type Status = "loading" | "signedOut" | "signedIn";

type AuthContextType = {
  status: Status;
  signIn: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");

 useEffect(() => { const token = getToken(); setStatus(token ? "signedIn" : "signedOut"); }, []);

  const signIn = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const token = process.env.EXPO_PUBLIC_DEV_TOKEN;
    if (!token) throw new Error("Missing EXPO_PUBLIC_DEV_TOKEN in apps/mobile/.env");

    await setToken(token);
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(() => {
    void setToken(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(
    () => ({ status, signIn, signOut }),
    [status, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
