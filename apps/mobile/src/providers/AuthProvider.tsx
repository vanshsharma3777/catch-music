import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { setToken } from "../lib/authStore";

type Status = "signedOut" | "signedIn";

type AuthContextType = {
  status: Status;
  signIn: () => Promise<void>;
  signOut: () => void;
};
console.log("DEV TOKEn" , process.env.EXPO_PUBLIC_DEV_TOKEN)
console.log("DEV TOKEn" , process.env.EXPO_PUBLIC_API_URL)
const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("signedOut");

  const signIn = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 700)); 
    if (!process.env.EXPO_PUBLIC_DEV_TOKEN) throw new Error("Missing EXPO_PUBLIC_EXPO_PUBLIC_DEV_TOKEN in apps/mobile/.env");
    setToken(process.env.EXPO_PUBLIC_DEV_TOKEN);
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(() => ({ status, signIn, signOut }), [status, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}