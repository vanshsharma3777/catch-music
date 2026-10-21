import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const KEY = "catchmusic_recent_searches";
const MAX = 8;

async function read(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

async function write(list: string[]) {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(list));
  } catch {}
}

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    read().then(setRecents);
  }, []);

  const add = useCallback((q: string) => {
    const term = q.trim();
    if (term.length < 2) return;

    setRecents((prev) => {
      const next = [
        term,
        ...prev.filter((x) => x.toLowerCase() !== term.toLowerCase()),
      ].slice(0, MAX);

      void write(next);
      return next;
    });
  }, []);

  const remove = useCallback((q: string) => {
    setRecents((prev) => {
      const next = prev.filter((x) => x !== q);
      void write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecents([]);
    void write([]);
  }, []);

  return { recents, add, remove, clear };
}