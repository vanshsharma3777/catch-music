import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../providers/AuthProvider";

export type Profile = {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  bio?: string;
};

let cached: Profile | null = null;

export function useProfile() {
  const { status } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(cached);

  useEffect(() => {
    if (status !== "signedIn") {
      cached = null;
      setProfile(null);
      return;
    }
    if (cached) return;
    let alive = true;
    api<{ user: Profile }>("/api/user/profile")
      .then((d) => {
        cached = d.user;
        if (alive) setProfile(d.user);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [status]);

  return profile;
}