"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSession } from "next-auth/react";
import { Song } from "../app/types/songs";
import { OfflineSong } from "../app/types/OfflineSong";
import { getCachedSongIds,getAllSongs as getOfflineCachedSongs , toggleCacheSong } from "../app/lib/cacheDb";


const LIKES_PAGE_SIZE = 100;

export interface PlaylistSummary {
  id: string;
  uuid?: string;
  name: string;
  description?: string;
  image?: string;
  isPublic?: boolean;
  songCount: number;
  creatorName: string;
  creatorId?: string;
  creatorImage?: string;
  isOwner: boolean;
  isSaved?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  bio?: string;
  createdAt?: string | Date;
}

export interface UserStats {
  likedSongsCount: number;
  createdPlaylistsCount: number;
  savedPlaylistsCount: number;
  offlineSongsCount: number;
}

export interface LibraryContextType {
  // Liked songs
  likedSongs: Song[];
  likedSongIds: Set<string>;
  /** Total liked songs on the server (can be larger than likedSongs.length while paging). */
  likesTotal: number;
  hasMoreLikes: boolean;
  isLoadingLikes: boolean;
  isLoadingMoreLikes: boolean;
  likesError: string | null;
  isLiked: (songId: string | number | undefined) => boolean;
  toggleLike: (song: Song) => Promise<boolean>;
  refreshLikes: () => Promise<void>;
  loadMoreLikes: () => Promise<void>;

  // Playlists
  createdPlaylists: PlaylistSummary[];
  savedPlaylists: PlaylistSummary[];
  isLoadingPlaylists: boolean;
  refreshPlaylists: () => Promise<void>;
  createPlaylist: (data: {
    name: string;
    description?: string;
    image?: string;
    isPublic?: boolean;
  }) => Promise<PlaylistSummary>;
  updatePlaylist: (
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      isPublic?: boolean;
    }
  ) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  savePlaylist: (id: string) => Promise<void>;
  removeSavedPlaylist: (id: string) => Promise<void>;
  isPlaylistSaved: (id: string) => boolean;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<boolean>;

  // Offline
  offlineSongs: OfflineSong[];
  cachedSongIds: Set<string>;
  isLoadingOffline: boolean;
  isOffline: (songId: string | number | undefined) => boolean;
  toggleOfflineSong: (song: Song) => Promise<boolean>;
  refreshOfflineSongs: () => Promise<void>;

  // Profile
  userProfile: UserProfile | null;
  userStats: UserStats;
  isLoadingProfile: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    username?: string;
    image?: string;
    bio?: string;
  }) => Promise<UserProfile>;

  // Add to Playlist modal state
  songForPlaylistModal: Song | null;
  openAddToPlaylistModal: (song: Song) => void;
  closeAddToPlaylistModal: () => void;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus } = useSession();

  // Likes state
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [likesTotal, setLikesTotal] = useState<number>(0);
  const [hasMoreLikes, setHasMoreLikes] = useState<boolean>(false);
  const [isLoadingLikes, setIsLoadingLikes] = useState<boolean>(true);
  const [isLoadingMoreLikes, setIsLoadingMoreLikes] = useState<boolean>(false);
  const [likesError, setLikesError] = useState<string | null>(null);

  // Playlists state
  const [createdPlaylists, setCreatedPlaylists] = useState<PlaylistSummary[]>([]);
  const [savedPlaylists, setSavedPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(true);

  // Offline state
  const [offlineSongs, setOfflineSongs] = useState<OfflineSong[]>([]);
  const [cachedSongIds, setCachedSongIds] = useState<Set<string>>(new Set());
  const [isLoadingOffline, setIsLoadingOffline] = useState<boolean>(true);

  // Profile & stats
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    likedSongsCount: 0,
    createdPlaylistsCount: 0,
    savedPlaylistsCount: 0,
    offlineSongsCount: 0,
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // Modal state
  const [songForPlaylistModal, setSongForPlaylistModal] = useState<Song | null>(null);

  // 1. Likes (paged). offset 0 replaces the list, offset > 0 appends the next page.
  const loadLikes = useCallback(
    async (offset = 0) => {
      if (authStatus !== "authenticated") return;
      if (offset > 0) setIsLoadingMoreLikes(true);
      try {
        const res = await fetch(`/api/likes?limit=${LIKES_PAGE_SIZE}&offset=${offset}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Could not load your liked songs.");
        }

        const page: Song[] = data.likedSongs || [];
        const total = Number(data.total ?? page.length);

        setLikedSongs((prev) => {
          if (offset === 0) return page;
          const known = new Set(prev.map((s) => String(s.id)));
          return [...prev, ...page.filter((s) => !known.has(String(s.id)))];
        });
        setLikedSongIds(new Set(data.likedSongIds || []));
        setLikesTotal(total);
        setHasMoreLikes(Boolean(data.hasMore));
        setLikesError(null);
        setUserStats((prev) => ({ ...prev, likedSongsCount: total }));
      } catch (err) {
        console.error("Error fetching likes:", err);
        setLikesError(err instanceof Error ? err.message : "Could not load your liked songs.");
      } finally {
        setIsLoadingLikes(false);
        setIsLoadingMoreLikes(false);
      }
    },
    [authStatus]
  );

  const fetchLikes = useCallback(() => loadLikes(0), [loadLikes]);

  /** Explicit refresh / retry: shows the loading state again. */
  const refreshLikes = useCallback(async () => {
    setIsLoadingLikes(true);
    await loadLikes(0);
  }, [loadLikes]);

  const loadMoreLikes = useCallback(async () => {
    if (isLoadingMoreLikes || !hasMoreLikes) return;
    await loadLikes(likedSongs.length);
  }, [isLoadingMoreLikes, hasMoreLikes, likedSongs.length, loadLikes]);

  // 2. Fetch playlists
  const fetchPlaylists = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    try {
      const res = await fetch("/api/playlists?type=all");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCreatedPlaylists(data.createdPlaylists || []);
          setSavedPlaylists(data.savedPlaylists || []);
          setUserStats((prev) => ({
            ...prev,
            createdPlaylistsCount: (data.createdPlaylists || []).length,
            savedPlaylistsCount: (data.savedPlaylists || []).length,
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching playlists:", err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, [authStatus]);

  // 3. Fetch offline songs
  const refreshOfflineSongs = useCallback(async () => {
    try {
      const local = getOfflineCachedSongs();
      setOfflineSongs(local);
      const ids = getCachedSongIds();
      setCachedSongIds(new Set(ids));
      setUserStats((prev) => ({
        ...prev,
        offlineSongsCount: local.length,
      }));
    } catch (err) {
      console.error("Error fetching offline songs:", err);
    } finally {
      setIsLoadingOffline(false);
    }
  }, []);

  // 4. Fetch profile
  const fetchProfile = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUserProfile(data.user);
          if (data.stats) {
            setUserStats(data.stats);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [authStatus]);

  // Initial load on authentication
  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchLikes();
      fetchPlaylists();
      fetchProfile();
    }
    refreshOfflineSongs();
  }, [authStatus, fetchLikes, fetchPlaylists, fetchProfile, refreshOfflineSongs]);

  // Check if liked
  const isLiked = useCallback(
    (songId: string | number | undefined): boolean => {
      if (!songId) return false;
      return likedSongIds.has(String(songId));
    },
    [likedSongIds]
  );

  // Toggle like with optimistic update. Every consumer (player, cards, profile) reads this same state.
  const toggleLike = useCallback(
    async (song: Song): Promise<boolean> => {
      if (!song || !song.id) return false;
      const id = String(song.id);
      const currentlyLiked = likedSongIds.has(id);
      const nextLiked = !currentlyLiked;

      // Optimistic update
      setLikedSongIds((prev) => {
        const next = new Set(prev);
        if (nextLiked) next.add(id);
        else next.delete(id);
        return next;
      });

      setLikedSongs((prev) => {
        if (nextLiked) {
          // Put at top of list
          const exists = prev.some((s) => String(s.id) === id);
          if (!exists) return [song, ...prev];
          return prev;
        } else {
          return prev.filter((s) => String(s.id) !== id);
        }
      });

      setLikesTotal((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
      setUserStats((prev) => ({
        ...prev,
        likedSongsCount: Math.max(0, prev.likedSongsCount + (nextLiked ? 1 : -1)),
      }));

      try {
        if (nextLiked) {
          const res = await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song }),
          });
          if (!res.ok) throw new Error("Failed to like");
        } else {
          const res = await fetch(`/api/likes?songId=${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to unlike");
        }
        return nextLiked;
      } catch (err) {
        console.error("Like toggle rollback on error:", err);
        setLikedSongIds((prev) => {
          const rollback = new Set(prev);
          if (currentlyLiked) rollback.add(id);
          else rollback.delete(id);
          return rollback;
        });
        fetchLikes();
        return currentlyLiked;
      }
    },
    [likedSongIds, fetchLikes]
  );

  // Check if offline
  const isOffline = useCallback(
    (songId: string | number | undefined): boolean => {
      if (!songId) return false;
      return cachedSongIds.has(String(songId));
    },
    [cachedSongIds]
  );

  // Toggle offline caching
  const toggleOfflineSong = useCallback(
    async (song: Song): Promise<boolean> => {
      if (!song || !song.id) return false;
      const id = String(song.id);
      const currentlyCached = cachedSongIds.has(id);

      try {
        const isNowCached = await toggleCacheSong(song, currentlyCached);

        // Sync local state
        await refreshOfflineSongs();

        // Sync server-side metadata asynchronously
        try {
          if (isNowCached) {
            await fetch("/api/offline", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ song }),
            });
          } else {
            await fetch(`/api/offline?songId=${encodeURIComponent(id)}`, {
              method: "DELETE",
            });
          }
        } catch {}

        return isNowCached;
      } catch (err) {
        console.error("Failed to toggle offline song:", err);
        throw err;
      }
    },
    [cachedSongIds, refreshOfflineSongs]
  );

  // Create playlist
  const createPlaylist = useCallback(
    async (data: {
      name: string;
      description?: string;
      image?: string;
      isPublic?: boolean;
    }): Promise<PlaylistSummary> => {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create playlist");
      }

      const created: PlaylistSummary = json.playlist;
      setCreatedPlaylists((prev) => [created, ...prev]);
      setUserStats((prev) => ({
        ...prev,
        createdPlaylistsCount: prev.createdPlaylistsCount + 1,
      }));
      return created;
    },
    []
  );

  // Update playlist
  const updatePlaylist = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        description?: string;
        image?: string;
        isPublic?: boolean;
      }
    ) => {
      const res = await fetch(`/api/playlists/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update playlist");
      }

      setCreatedPlaylists((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: data.name !== undefined ? data.name : p.name,
                description:
                  data.description !== undefined ? data.description : p.description,
                image: data.image !== undefined ? data.image : p.image,
                isPublic: data.isPublic !== undefined ? data.isPublic : p.isPublic,
              }
            : p
        )
      );
    },
    []
  );

  // Delete playlist
  const deletePlaylist = useCallback(async (id: string) => {
    const res = await fetch(`/api/playlists/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete playlist");
    }

    setCreatedPlaylists((prev) => prev.filter((p) => p.id !== id));
    setUserStats((prev) => ({
      ...prev,
      createdPlaylistsCount: Math.max(0, prev.createdPlaylistsCount - 1),
    }));
  }, []);

  // Save playlist
  const savePlaylist = useCallback(async (id: string) => {
    const res = await fetch(`/api/playlists/${encodeURIComponent(id)}/save`, {
      method: "POST",
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to save playlist");
    }

    await fetchPlaylists();
  }, [fetchPlaylists]);

  // Remove saved playlist
  const removeSavedPlaylist = useCallback(async (id: string) => {
    const res = await fetch(`/api/playlists/${encodeURIComponent(id)}/save`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to remove saved playlist");
    }

    setSavedPlaylists((prev) => prev.filter((p) => p.id !== id));
    setUserStats((prev) => ({
      ...prev,
      savedPlaylistsCount: Math.max(0, prev.savedPlaylistsCount - 1),
    }));
  }, []);

  // Is playlist saved
  const isPlaylistSaved = useCallback(
    (id: string): boolean => {
      return savedPlaylists.some((p) => p.id === id);
    },
    [savedPlaylists]
  );

  // Add song to playlist
  const addSongToPlaylist = useCallback(
    async (playlistId: string, song: Song): Promise<boolean> => {
      const res = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add song to playlist");
      }

      setCreatedPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, songCount: p.songCount + 1 } : p
        )
      );

      return true;
    },
    []
  );

  // Remove song from playlist
  const removeSongFromPlaylist = useCallback(
    async (playlistId: string, songId: string): Promise<boolean> => {
      const res = await fetch(
        `/api/playlists/${encodeURIComponent(playlistId)}/songs?songId=${encodeURIComponent(songId)}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to remove song from playlist");
      }

      setCreatedPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId
            ? { ...p, songCount: Math.max(0, p.songCount - 1) }
            : p
        )
      );

      return true;
    },
    []
  );

  // Update profile
  const updateProfile = useCallback(
    async (data: {
      name?: string;
      username?: string;
      image?: string;
      bio?: string;
    }): Promise<UserProfile> => {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }

      setUserProfile(json.user);
      return json.user;
    },
    []
  );

  const openAddToPlaylistModal = useCallback((song: Song) => {
    setSongForPlaylistModal(song);
  }, []);

  const closeAddToPlaylistModal = useCallback(() => {
    setSongForPlaylistModal(null);
  }, []);

  const value = useMemo(
    () => ({
      likedSongs,
      likedSongIds,
      likesTotal,
      hasMoreLikes,
      isLoadingLikes,
      isLoadingMoreLikes,
      likesError,
      isLiked,
      toggleLike,
      refreshLikes,
      loadMoreLikes,
      createdPlaylists,
      savedPlaylists,
      isLoadingPlaylists,
      refreshPlaylists: fetchPlaylists,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      savePlaylist,
      removeSavedPlaylist,
      isPlaylistSaved,
      addSongToPlaylist,
      removeSongFromPlaylist,
      offlineSongs,
      cachedSongIds,
      isLoadingOffline,
      isOffline,
      toggleOfflineSong,
      refreshOfflineSongs,
      userProfile,
      userStats,
      isLoadingProfile,
      refreshProfile: fetchProfile,
      updateProfile,
      songForPlaylistModal,
      openAddToPlaylistModal,
      closeAddToPlaylistModal,
    }),
    [
      likedSongs,
      likedSongIds,
      likesTotal,
      hasMoreLikes,
      isLoadingLikes,
      isLoadingMoreLikes,
      likesError,
      isLiked,
      toggleLike,
      refreshLikes,
      loadMoreLikes,
      createdPlaylists,
      savedPlaylists,
      isLoadingPlaylists,
      fetchPlaylists,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      savePlaylist,
      removeSavedPlaylist,
      isPlaylistSaved,
      addSongToPlaylist,
      removeSongFromPlaylist,
      offlineSongs,
      cachedSongIds,
      isLoadingOffline,
      isOffline,
      toggleOfflineSong,
      refreshOfflineSongs,
      userProfile,
      userStats,
      isLoadingProfile,
      fetchProfile,
      updateProfile,
      songForPlaylistModal,
      openAddToPlaylistModal,
      closeAddToPlaylistModal,
    ]
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
