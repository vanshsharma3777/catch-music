import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HomeUser, Singer, Song } from "../types/song";
import { fetchPreferences, fetchSingerSongs, mixSongs } from "../lib/songsApi";
import { getLikedCount, syncLikes, useLikedCount } from "../lib/likedStore";

// Used until the mobile app has its own artist-picker (new users have none saved).
const DEFAULT_SINGERS: Singer[] = [
  { id: "d1", name: "Arijit Singh" },
  { id: "d2", name: "Pritam" },
  { id: "d3", name: "Shreya Ghoshal" },
];

export function useHomeData(enabled: boolean) {
  const [user, setUser] = useState<HomeUser | null>(null);
  const [singers, setSingers] = useState<Singer[]>([]);
  const [bySinger, setBySinger] = useState<Record<string, Song[]>>({});
  const [liked, setLiked] = useState<Song[]>([]);
  const [activeSingerId, setActiveSingerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const likedCount = useLikedCount();
  const syncedCount = useRef(-1);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const prefs = await fetchPreferences();
      const list = (prefs.singers.length ? prefs.singers : DEFAULT_SINGERS).slice(0, 6);
      setUser(prefs.user);
      setSingers(list);

      const [results, likedSongs] = await Promise.all([
        Promise.all(
          list.map(async (s) => [s.id, await fetchSingerSongs(s.name).catch(() => [] as Song[])] as const)
        ),
        syncLikes().catch(() => [] as Song[]),
      ]);
      setBySinger(Object.fromEntries(results));
      setLiked(likedSongs);
      syncedCount.current = getLikedCount();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void load("initial");
  }, [enabled, load]);

  // Keep the "Liked songs" row fresh when the user likes/unlikes something
  useEffect(() => {
    if (!enabled || syncedCount.current < 0 || likedCount === syncedCount.current) return;
    syncLikes()
      .then((songs) => {
        setLiked(songs);
        syncedCount.current = getLikedCount();
      })
      .catch(() => {});
  }, [likedCount, enabled]);

  const mixed = useMemo(() => mixSongs(singers.map((s) => bySinger[s.id] ?? []), 24), [singers, bySinger]);
  const suggested = activeSingerId ? bySinger[activeSingerId] ?? [] : mixed;

  return {
    user,
    singers,
    liked,
    suggested,
    mixed,
    activeSingerId,
    setActiveSingerId,
    loading,
    refreshing,
    error,
    refresh: () => load("refresh"),
    retry: () => load("initial"),
  };
}