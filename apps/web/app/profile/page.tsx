"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  ArrowLeft,
  BookmarkMinus,
  CalendarDays,
  Globe,
  Headphones,
  Heart,
  Library,
  ListMusic,
  Lock,
  Mail,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { usePlayer, formatAudioTime, getArtistDisplayName } from "../../components/player";
import { CoverImage, getImageUrl } from "../../components/CoverImage";
import {
  api,
  errMsg,
  type PlaylistItem,
  type PlaylistWithSongs,
  type Profile,
  type Remote,
} from "../../components/profile/shared";
import type { Song } from "../types/songs";
import { AmbientBackground } from "../../components/AmbientBackground";
import ModalLayer from "../../components/profile/ModalLayer";
import { CreatePlaylistModal, EditProfileModal } from "../../components/profile/ProfileModals";
import SongMenu from "../../components/SongMenu";
import { markLiked } from "../lib/likedStore";
import Toaster, { useToaster } from "../../components/connectivity/Toaster";

type Tab = "overview" | "liked" | "saved" | "created";

interface LikesState {
  songs: Song[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

interface PlaylistsState {
  created: PlaylistItem[];
  saved: PlaylistItem[];
  loading: boolean;
  error: string | null;
}

interface DetailState {
  id: string;
  loading: boolean;
  error: string | null;
  playlist: PlaylistWithSongs | null;
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl bg-white/[0.04] p-8 text-center backdrop-blur-xl">
      <AlertTriangle size={28} className="mx-auto text-error" />
      <h3 className="mt-3 text-sm font-bold text-pri">Couldn&apos;t load this</h3>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-bold text-bg transition hover:scale-105 active:scale-95"
      >
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-3xl bg-white/[0.04] p-10 text-center backdrop-blur-xl">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">{icon}</span>
      <h3 className="mt-4 text-sm font-bold text-pri">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-sec">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-bg transition hover:scale-105 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  count,
  onSeeAll,
}: {
  title: string;
  count?: number;
  onSeeAll?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-lg font-extrabold tracking-tight text-pri">
        {title}
        {typeof count === "number" && <span className="ml-2 text-sm font-semibold text-muted">{count}</span>}
      </h3>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll} className="text-xs font-semibold text-accent hover:underline">
          See all
        </button>
      )}
    </div>
  );
}

function RowSkeleton({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-2.5 py-2">
          <div className="h-12 w-12 rounded-xl bg-white/[0.07]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-white/[0.07]" />
            <div className="h-3 w-1/3 rounded bg-white/[0.07]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 rounded-3xl bg-white/[0.04] p-2.5">
          <div className="aspect-square rounded-2xl bg-white/[0.06]" />
          <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
          <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3.5 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent transition-transform group-hover:scale-105">
        {icon}
      </span>
      <span className="min-w-0">
        {loading ? (
          <span className="block h-6 w-10 animate-pulse rounded bg-white/[0.08]" />
        ) : (
          <span className="block text-2xl font-black leading-none tracking-tight text-pri">{value}</span>
        )}
        <span className="mt-1 block truncate text-[11px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
      </span>
    </button>
  );
}

function SongRow({
  song,
  index,
  playing,
  onPlay,
  menu,
  onUnlike,
}: {
  song: Song;
  index: number;
  menu?: React.ReactNode;
  playing: boolean;
  onPlay: () => void;
  onUnlike?: () => void;
}) {
  const title = song.name || song.title || "Untitled";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => e.key === "Enter" && onPlay()}
      aria-label={`Play ${title}`}
      className={`group flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-accent ${
        playing ? "bg-accent/10" : ""
      }`}
    >
      <span className="hidden w-5 text-center text-xs tabular-nums text-muted sm:block">{index + 1}</span>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)]">
        <CoverImage src={getImageUrl(song)} name={title} className="h-full w-full" />
        <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {playing ? (
            <Pause size={18} fill="white" className="text-white" />
          ) : (
            <Play size={18} fill="white" className="text-white" />
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${playing ? "text-accent" : "text-pri"}`}>{title}</p>
        <p className="truncate text-xs text-muted">{getArtistDisplayName(song)}</p>
      </div>
      <span className="hidden text-xs tabular-nums text-muted sm:block">
        {song.duration ? formatAudioTime(song.duration) : ""}
      </span>
      <span className="hidden text-xs tabular-nums text-muted sm:block">…</span>
      {menu}

      {onUnlike && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnlike();
          }}
          aria-label="Remove from liked songs"
          title="Remove from liked songs"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-accent transition hover:bg-white/10"
        >
          <Heart size={16} fill="currentColor" />
        </button>
      )}
    </div>
  );
}

function PlaylistCard({ p, onOpen }: { p: PlaylistItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group rounded-3xl p-2.5 text-left transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="aspect-square w-full overflow-hidden rounded-2xl shadow-[0_12px_30px_-14px_rgba(0,0,0,0.8)]">
        <CoverImage
          src={p.image || p.previewImage}
          name={p.name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <p className="mt-3 truncate px-1 text-sm font-bold text-pri">{p.name}</p>
      <p className="flex items-center gap-1.5 truncate px-1 text-xs text-muted">
        {p.isPublic ? <Globe size={11} /> : <Lock size={11} />}
        {p.songCount} {p.songCount === 1 ? "song" : "songs"}
        {!p.isOwner && p.creatorName ? ` · ${p.creatorName}` : ""}
      </p>
    </button>
  );
}

function PlaylistGrid({
  items,
  limit,
  onOpen,
}: {
  items: PlaylistItem[];
  limit?: number;
  onOpen: (p: PlaylistItem) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
      {(limit ? items.slice(0, limit) : items).map((p) => (
        <PlaylistCard key={p.id} p={p} onOpen={() => onOpen(p)} />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { status, update: refreshSession } = useSession();
  const player = usePlayer();
  const { toasts, push, dismiss } = useToaster();

  const toastSuccess = useCallback(
    (title: string, message?: string) => push({ variant: "success", title, message }),
    [push]
  );
  const toastInfo = useCallback(
    (title: string, message?: string) => push({ variant: "info", title, message }),
    [push]
  );
  const toastError = useCallback(
    (title: string, message?: string, retry?: () => void) =>
      push({
        variant: "error",
        title,
        message,
        action: retry ? { label: "Try again", onClick: retry } : undefined,
      }),
    [push]
  );

  const [tab, setTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<Remote<Profile | null>>({ data: null, loading: true, error: null });
  const [likes, setLikes] = useState<LikesState>({
    songs: [],
    total: 0,
    hasMore: false,
    loading: true,
    loadingMore: false,
    error: null,
  });
  const [lists, setLists] = useState<PlaylistsState>({ created: [], saved: [], loading: true, error: null });
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const protectedIds = useRef<Set<string>>(new Set());
  const attemptedDeletes = useRef<Set<string>>(new Set());

  const loadProfile = useCallback(async () => {
    setProfile((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api<{ user: Profile }>("/api/user/profile");
      setProfile({ data: res.user, loading: false, error: null });
    } catch (e) {
      const msg = errMsg(e);
      setProfile((s) => ({ ...s, loading: false, error: msg }));
      toastError("Couldn't load your profile", msg, () => void loadProfile());
    }
  }, [toastError]);

  const loadLikes = useCallback(
    async (offset = 0) => {
      setLikes((s) =>
        offset
          ? { ...s, loadingMore: true, error: null }
          : { ...s, loading: true, error: null }
      );

      try {
        const d = await api<{
          likedSongs: Song[];
          total: number;
          hasMore: boolean;
        }>(`/api/likes?limit=100&offset=${offset}`);

        setLikes((s) => {
          const known = new Set(s.songs.map((x) => String(x.id)));

          return {
            songs: offset
              ? [
                  ...s.songs,
                  ...d.likedSongs.filter((n) => !known.has(String(n.id))),
                ]
              : d.likedSongs,
            total: d.total,
            hasMore: d.hasMore,
            loading: false,
            loadingMore: false,
            error: null,
          };
        });
      } catch (e) {
        console.error("Load Likes Error:", e);
        const msg = errMsg(e);

        setLikes((s) => ({
          ...s,
          loading: false,
          loadingMore: false,
          error: msg,
        }));
        toastError("Couldn't load liked songs", msg, () => void loadLikes(offset));
      }
    },
    [toastError]
  );

  const loadPlaylists = useCallback(async () => {
    setLists((s) => ({ ...s, loading: true, error: null }));
    try {
      const d = await api<{ createdPlaylists: PlaylistItem[]; savedPlaylists: PlaylistItem[] }>(
        "/api/playlists?type=all"
      );
      setLists({ created: d.createdPlaylists, saved: d.savedPlaylists, loading: false, error: null });
    } catch (e) {
      const msg = errMsg(e);
      setLists((s) => ({ ...s, loading: false, error: msg }));
      toastError("Couldn't load playlists", msg, () => void loadPlaylists());
    }
  }, [toastError]);

  const deletePlaylistSilently = useCallback(async (id: string) => {
    await api(`/api/playlists/${encodeURIComponent(id)}`, { method: "DELETE" });
    setLists((s) => ({ ...s, created: s.created.filter((p) => p.id !== id) }));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (status === "authenticated") {
      void loadProfile();
      void loadLikes();
      void loadPlaylists();
    }
  }, [status, router, loadProfile, loadLikes, loadPlaylists]);

  useEffect(() => {
    if (lists.loading || lists.error) return;

    const empty = lists.created.filter(
      (p) =>
        p.songCount === 0 &&
        !protectedIds.current.has(p.id) &&
        !attemptedDeletes.current.has(p.id)
    );
    if (empty.length === 0) return;

    empty.forEach((p) => attemptedDeletes.current.add(p.id));

    void (async () => {
      let removed = 0;
      for (const p of empty) {
        try {
          await deletePlaylistSilently(p.id);
          removed += 1;
        } catch (e) {
          console.error("Auto-delete failed:", e);
        }
      }
      if (removed > 0) {
        toastInfo(
          "Cleaned up",
          `Removed ${removed} empty playlist${removed > 1 ? "s" : ""}.`
        );
      }
    })();
  }, [lists.loading, lists.error, lists.created, deletePlaylistSilently, toastInfo]);

  const onProfileSaved = (updated: Profile) => {
    setProfile({ data: updated, loading: false, error: null });
    toastSuccess("Profile updated", "Your changes have been saved.");
    void refreshSession().catch(() => {});
  };

  const openPlaylist = async (p: PlaylistItem) => {
    setDetail({ id: p.id, loading: true, error: null, playlist: null });
    try {
      const res = await api<{ playlist: PlaylistWithSongs }>(`/api/playlists/${encodeURIComponent(p.id)}`);
      setDetail({ id: p.id, loading: false, error: null, playlist: res.playlist });
    } catch (e) {
      const msg = errMsg(e);
      setDetail({ id: p.id, loading: false, error: msg, playlist: null });
      toastError("Couldn't open playlist", msg, () => void openPlaylist(p));
    }
  };

  const unlike = async (song: Song) => {
    const id = String(song.id);
    markLiked(id, false);

    setLikes((s) => ({
      ...s,
      songs: s.songs.filter((x) => String(x.id) !== id),
      total: Math.max(0, s.total - 1),
    }));
    try {
      await api(`/api/likes?songId=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (e) {
      toastError("Couldn't remove from liked songs", errMsg(e));
      void loadLikes();
    }
  };

  const removeSaved = async (id: string) => {
    try {
      await api(`/api/playlists/${encodeURIComponent(id)}/save`, { method: "DELETE" });
      setLists((s) => ({ ...s, saved: s.saved.filter((p) => p.id !== id) }));
      setDetail(null);
    } catch (e) {
      toastError("Couldn't remove saved playlist", errMsg(e));
    }
  };

  const deleteCreated = async (id: string) => {
    if (!window.confirm("Delete this playlist? This cannot be undone.")) return;
    try {
      await api(`/api/playlists/${encodeURIComponent(id)}`, { method: "DELETE" });
      setLists((s) => ({ ...s, created: s.created.filter((p) => p.id !== id) }));
      setDetail(null);
    } catch (e) {
      toastError("Couldn't delete playlist", errMsg(e));
    }
  };

  const goTab = (t: Tab) => {
    setDetail(null);
    setTab(t);
  };

  const playSongs = (song: Song, list: Song[]) => player.playSong(song, list);
  const isPlayingSong = (s: Song) => String(player.currentSong?.id) === String(s.id) && player.isPlaying;

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-bg text-pri">
        <RefreshCw size={36} className="animate-spin text-accent" />
        <p className="text-sm font-medium text-sec">Loading your profile...</p>
      </div>
    );
  }

  const p = profile.data;
  const memberSince = p?.createdAt
    ? new Date(p.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "Overview", icon: <Headphones size={15} /> },
    { id: "liked", label: "Liked Songs", icon: <Heart size={15} />, count: likes.loading ? undefined : likes.total },
    { id: "saved", label: "Saved Playlists", icon: <Library size={15} />, count: lists.loading ? undefined : lists.saved.length },
    { id: "created", label: "Created Playlists", icon: <ListMusic size={15} />, count: lists.loading ? undefined : lists.created.length },
  ];

  const renderLiked = (limit?: number) => {
    if (likes.loading) return <RowSkeleton n={limit ?? 6} />;
    if (likes.error && likes.songs.length === 0) return <ErrorBox onRetry={() => void loadLikes()} />;
    if (likes.songs.length === 0) {
      return (
        <EmptyState
          icon={<Heart size={24} />}
          title="No liked songs yet"
          text="Tap the heart on any song and it will show up here."
          action={{ label: "Discover music", onClick: () => router.push("/home") }}
        />
      );
    }
    const shown = limit ? likes.songs.slice(0, limit) : likes.songs;
    return (
      <div className="space-y-3">
        <div className="space-y-0.5">
          {shown.map((song, i) => (
            <SongRow
              key={`${song.id}-${i}`}
              song={song}
              index={i}
              playing={isPlayingSong(song)}
              onPlay={() => playSongs(song, likes.songs)}
              onUnlike={() => void unlike(song)}
              menu={
                <SongMenu
                  variant="row"
                  song={song}
                  onLikeChange={(l) =>
                    !l &&
                    setLikes((s) => ({
                      ...s,
                      songs: s.songs.filter((x) => String(x.id) !== String(song.id)),
                      total: Math.max(0, s.total - 1),
                    }))
                  }
                />
              }
            />
          ))}
        </div>
        {!limit && likes.hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => void loadLikes(likes.songs.length)}
              disabled={likes.loadingMore}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-6 py-2.5 text-xs font-semibold text-pri backdrop-blur-xl transition hover:bg-white/[0.13] disabled:opacity-60"
            >
              {likes.loadingMore && <RefreshCw size={13} className="animate-spin" />}
              Show more songs
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPlaylists = (kind: "saved" | "created", limit?: number) => {
    if (lists.loading) return <GridSkeleton n={limit ?? 4} />;
    if (lists.error) return <ErrorBox onRetry={() => void loadPlaylists()} />;
    const items = kind === "saved" ? lists.saved : lists.created;
    if (items.length === 0) {
      return kind === "saved" ? (
        <EmptyState
          icon={<Library size={24} />}
          title="No saved playlists"
          text="Save public playlists from other listeners and they will live here."
        />
      ) : (
        <EmptyState
          icon={<ListMusic size={24} />}
          title="You haven't created a playlist yet"
          text="Group your favourite songs into a playlist of your own."
          action={{ label: "Create playlist", onClick: () => setShowCreate(true) }}
        />
      );
    }
    return <PlaylistGrid items={items} limit={limit} onOpen={(pl) => void openPlaylist(pl)} />;
  };

  const removeFromPlaylist = async (playlistId: string, song: Song) => {
    try {
      const result = await api<unknown>(
        `/api/playlists/${encodeURIComponent(playlistId)}/songs?songId=${encodeURIComponent(
          String(song.id)
        )}`,
        { method: "DELETE" }
      );
      if (result instanceof Response && !result.ok) {
        throw new Error(`Failed to remove song (${result.status}). Please try again.`);
      }

      const remaining =
        detail?.id === playlistId && detail.playlist
          ? detail.playlist.songs.filter((item) => String(item.id) !== String(song.id))
          : [];

      if (remaining.length === 0) {
        attemptedDeletes.current.add(playlistId);
        await deletePlaylistSilently(playlistId);
        setDetail(null);
        toastInfo("Playlist deleted", "That was the last song, so the empty playlist was deleted.");
        return;
      }

      setDetail((current) => {
        if (!current || current.id !== playlistId || !current.playlist) return current;
        return {
          ...current,
          error: null,
          playlist: { ...current.playlist, songs: remaining },
        };
      });

      toastSuccess("Song removed", `"${song.name || song.title || "Song"}" was removed from the playlist.`);
      void loadPlaylists();
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      toastError(
        "Couldn't remove song",
        errMsg(error) || "Couldn't remove this song from the playlist. Please try again."
      );
    }
  };

  const renderDetail = (d: DetailState) => {
    const pl = d.playlist;
    return (
      <section className="space-y-5">
        <button
          type="button"
          onClick={() => setDetail(null)}
          className="flex items-center gap-2 text-sm font-semibold text-sec transition hover:text-pri"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {d.loading && <RowSkeleton n={6} />}
        {d.error && <ErrorBox onRetry={() => void openPlaylist({ id: d.id } as PlaylistItem)} />}

        {pl && (
          <>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
              <CoverImage
                src={pl.image || pl.previewImage || (pl.songs[0] ? getImageUrl(pl.songs[0]) : "")}
                name={pl.name}
                className="h-40 w-40 shrink-0 rounded-3xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] sm:h-48 sm:w-48"
              />
              <div className="min-w-0 text-center sm:text-left">
                <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-sec sm:justify-start">
                  {pl.isPublic ? <Globe size={13} /> : <Lock size={13} />}
                  {pl.isPublic ? "Public" : "Private"} playlist
                </p>
                <h2 className="text-balance text-3xl font-black tracking-tight text-pri sm:text-5xl">{pl.name}</h2>
                {pl.description && <p className="mt-1 max-w-xl text-sm text-sec">{pl.description}</p>}
                <p className="mt-1 text-sm text-muted">
                  {pl.isOwner ? "By you" : `By ${pl.creatorName}`} · {pl.songs.length}{" "}
                  {pl.songs.length === 1 ? "song" : "songs"}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <button
                    type="button"
                    disabled={pl.songs.length === 0}
                    onClick={() => pl.songs[0] && playSongs(pl.songs[0], pl.songs)}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-bg shadow-lg shadow-black/30 transition hover:scale-105 disabled:opacity-40"
                  >
                    <Play size={16} fill="currentColor" /> Play all
                  </button>
                  {pl.isOwner ? (
                    <button
                      type="button"
                      onClick={() => void deleteCreated(pl.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-3 text-xs font-semibold text-sec backdrop-blur-xl transition hover:bg-red-500/15 hover:text-red-400"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void removeSaved(pl.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-3 text-xs font-semibold text-sec backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-pri"
                    >
                      <BookmarkMinus size={14} /> Remove from saved
                    </button>
                  )}
                </div>
              </div>
            </div>

            {pl.songs.length === 0 ? (
              <EmptyState
                icon={<Music2 size={24} />}
                title="This playlist is empty"
                text="Songs added to this playlist will appear here."
              />
            ) : (
              <div className="space-y-0.5">
                {pl.songs.map((song, i) => (
                  <SongRow
                    key={`${song.id}-${i}`}
                    song={song}
                    index={i}
                    playing={isPlayingSong(song)}
                    onPlay={() => playSongs(song, pl.songs)}
                    menu={
                      <SongMenu
                        variant="row"
                        song={song}
                        onRemoveFromPlaylist={
                          pl.isOwner ? () => removeFromPlaylist(pl.id, song) : undefined
                        }
                      />
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    );
  };

  const renderOverview = () => (
    <div className="space-y-10">
      {p && (
        <section className="rounded-3xl bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6">
          <SectionTitle title="About" />
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                <Mail size={16} />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">Email</dt>
                <dd className="truncate text-pri">{p.email}</dd>
              </div>
            </div>
            {memberSince && (
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                  <CalendarDays size={16} />
                </span>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">Member since</dt>
                  <dd className="text-pri">{memberSince}</dd>
                </div>
              </div>
            )}
          </dl>

          {p.favoriteSingers.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Favourite artists</p>
              <div className="flex flex-wrap gap-2">
                {p.favoriteSingers.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => router.push(`/favorite-singers?singers=${s.id}`)}
                    className="flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1 pr-3.5 text-xs font-semibold text-pri transition hover:bg-white/[0.12]"
                  >
                    <CoverImage src={s.image} name={s.name} kind="singer" className="h-7 w-7 rounded-full" />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section>
        <SectionTitle
          title="Recently liked"
          onSeeAll={likes.songs.length > 5 ? () => goTab("liked") : undefined}
        />
        {renderLiked(5)}
      </section>

      <section>
        <SectionTitle
          title="Created playlists"
          onSeeAll={lists.created.length > 4 ? () => goTab("created") : undefined}
        />
        {renderPlaylists("created", 4)}
      </section>

      <section>
        <SectionTitle
          title="Saved playlists"
          onSeeAll={lists.saved.length > 4 ? () => goTab("saved") : undefined}
        />
        {renderPlaylists("saved", 4)}
      </section>
    </div>
  );

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-bg px-4 py-8 pb-40 text-pri sm:px-8 lg:px-16">
      <style>{`
        .no-scrollbar{scrollbar-width:none}
        .no-scrollbar::-webkit-scrollbar{display:none}
      `}</style>

      <AmbientBackground />
      <Toaster toasts={toasts} onDismiss={dismiss} />

      <main className="relative z-10 mx-auto w-full max-w-5xl space-y-8">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-pri backdrop-blur-xl transition hover:bg-white/[0.12]"
        >
          <ArrowLeft size={14} className="text-accent" /> Back to Home
        </button>

        {profile.error && !p ? (
          <ErrorBox onRetry={() => void loadProfile()} />
        ) : (
          <header className="rounded-[2rem] border border-border-light bg-gradient-to-b from-surface to-card p-6 shadow-lg sm:p-8">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
              {profile.loading || !p ? (
                <>
                  <div className="h-32 w-32 shrink-0 animate-pulse rounded-full bg-white/[0.07] sm:h-36 sm:w-36" />
                  <div className="w-full flex-1 space-y-3">
                    <div className="mx-auto h-8 w-2/3 animate-pulse rounded bg-white/[0.07] sm:mx-0" />
                    <div className="mx-auto h-4 w-1/3 animate-pulse rounded bg-white/[0.07] sm:mx-0" />
                    <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-white/[0.07] sm:mx-0" />
                  </div>
                </>
              ) : (
                <>
                  <CoverImage
                    src={p.image}
                    name={p.name}
                    kind="singer"
                    className="h-32 w-32 shrink-0 rounded-full shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)] ring-2 ring-accent/40 sm:h-36 sm:w-36"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">Profile</p>
                    <h1 className="mt-1 text-balance text-3xl font-black tracking-tight sm:text-5xl">{p.name}</h1>
                    {p.username ? (
                      <p className="mt-1 text-sm font-semibold text-accent">@{p.username}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        className="mt-1 text-sm font-medium text-muted transition hover:text-accent"
                      >
                        Set a username
                      </button>
                    )}
                    {p.bio && <p className="mx-auto mt-2 max-w-xl text-sm text-sec sm:mx-0">{p.bio}</p>}
                    <p className="mt-2 truncate text-xs text-sec">
                      {p.email}
                      {memberSince ? ` · Joined ${memberSince}` : ""}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                      <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-border-light bg-bg-ter px-5 py-2.5 text-sm font-semibold text-pri transition hover:bg-surface active:scale-95"
                      >
                        <Pencil size={15} className="text-accent" /> Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-bg shadow-lg shadow-black/30 transition hover:scale-105 active:scale-95"
                      >
                        <Plus size={16} strokeWidth={2.5} /> Create Playlist
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-3">
              <StatCard
                icon={<Heart size={20} />}
                label="Liked songs"
                value={likes.total}
                loading={likes.loading}
                onClick={() => goTab("liked")}
              />
              <StatCard
                icon={<Library size={20} />}
                label="Saved playlists"
                value={lists.saved.length}
                loading={lists.loading}
                onClick={() => goTab("saved")}
              />
              <StatCard
                icon={<ListMusic size={20} />}
                label="Created playlists"
                value={lists.created.length}
                loading={lists.loading}
                onClick={() => goTab("created")}
              />
            </div>
          </header>
        )}

        <nav
          role="tablist"
          aria-label="Profile sections"
          className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => goTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-xl transition ${
                tab === t.id
                  ? "bg-accent text-bg"
                  : "bg-white/[0.06] text-sec hover:bg-white/[0.12] hover:text-pri"
              }`}
            >
              {t.icon}
              {t.label}
              {typeof t.count === "number" && <span className="opacity-70">{t.count}</span>}
            </button>
          ))}
        </nav>

        <div role="tabpanel">
          {detail ? (
            renderDetail(detail)
          ) : tab === "overview" ? (
            renderOverview()
          ) : tab === "liked" ? (
            <section>
              <SectionTitle title="Liked songs" count={likes.loading ? undefined : likes.total} />
              {renderLiked()}
            </section>
          ) : tab === "saved" ? (
            <section>
              <SectionTitle title="Saved playlists" count={lists.loading ? undefined : lists.saved.length} />
              {renderPlaylists("saved")}
            </section>
          ) : (
            <section>
              <SectionTitle title="Created playlists" count={lists.loading ? undefined : lists.created.length} />
              {renderPlaylists("created")}
            </section>
          )}
        </div>
      </main>

      {showEdit && p && (
        <EditProfileModal
          profile={p}
          onClose={() => setShowEdit(false)}
          onSaved={onProfileSaved}
        />
      )}
      {showCreate && (
        <CreatePlaylistModal
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            protectedIds.current.add(created.id);
            setLists((s) => ({ ...s, created: [created, ...s.created] }));
            toastSuccess("Playlist created", `"${created.name}" is ready for songs.`);
            goTab("created");
          }}
        />
      )}
    </div>
  );
}
