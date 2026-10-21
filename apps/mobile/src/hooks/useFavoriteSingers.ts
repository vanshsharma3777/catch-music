import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { SINGER_DATABASE, type Singer } from "../constants/singers";
import { shuffle } from "../lib/songHelpers";
import { useAuth } from "../providers/AuthProvider";

let cached: Singer[] | null = null;

export function useFavoriteSingers() {
  const { status } = useAuth();
  const [singers, setSingers] = useState<Singer[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (status !== "signedIn") {
      cached = null;
      setSingers([]);
      return;
    }
    if (cached) return;
    let alive = true;

    api<{ favoriteSingers?: Singer[] }>("/api/user/preferences")
      .then((d) => {
        const list = d.favoriteSingers?.length ? d.favoriteSingers : shuffle(SINGER_DATABASE).slice(0, 3);
        cached = list;
        if (alive) setSingers(list);
      })
      .catch(() => {
        const list = shuffle(SINGER_DATABASE).slice(0, 3);
        cached = list;
        if (alive) setSingers(list);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [status]);

  return { singers, loading };
}