"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  EllipsisVertical,
  Globe,
  Heart,
  Link2,
  ListPlus,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { Song } from "../app/types/songs";
import { ensureLikesLoaded, toggleLike, useIsLiked } from "../app/lib/likedStore";
import { isSongCached, toggleCacheSong } from "../app/lib/cacheDb";
import { CreatePlaylistModal } from "./profile/ProfileModals";

type PlaylistLite = { id: string; name: string; isPublic: boolean; songCount: number };

interface SongMenuProps {
  song: Song;
  variant?: "overlay" | "row";
  className?: string;
  /** Pass these when the parent already manages offline state (home, search). Otherwise cacheDb is used directly. */
  isCached?: boolean;
  onToggleCache?: (e: React.MouseEvent) => void;
  cacheDisabled?: boolean;
  /** Shows "Remove from this playlist" (owner views only). */
  onRemoveFromPlaylist?: () => Promise<void> | void;
  onLikeChange?: (liked: boolean) => void;
}

const PANEL_W = 224;
const PANEL_H = 300;
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

const itemCls =
  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-pri transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40";

export default function SongMenu({
  song,
  variant = "overlay",
  className = "",
  isCached,
  onToggleCache,
  cacheDisabled,
  onRemoveFromPlaylist,
  onLikeChange,
}: SongMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "playlists">("main");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistLite[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [localCached, setLocalCached] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const liked = useIsLiked(song.id);
  const cached = isCached ?? localCached;
  const title = song.name || song.title || "this song";

  const close = useCallback(() => {
    setOpen(false);
    setView("main");
    setStatus(null);
  }, []);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) return close();
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const left = Math.min(Math.max(8, r.right - PANEL_W), window.innerWidth - PANEL_W - 8);
      const flip = window.innerHeight - r.bottom < PANEL_H + 8 && r.top > PANEL_H;
      setPos({ top: flip ? r.top - PANEL_H - 4 : r.bottom + 4, left });
    }
    setOnline(navigator.onLine);
    setLocalCached(isSongCached(String(song.id)));
    void ensureLikesLoaded();
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  const flash = (text: string, error = false, closeAfter = false) => {
    setStatus({ text, error });
    if (closeAfter) setTimeout(close, 900);
  };

  const handleLike = async () => {
    setBusy("like");
    try {
      const next = await toggleLike(song);
      onLikeChange?.(next);
      flash(next ? "Added to liked songs" : "Removed from liked songs", false, true);
    } catch {
      flash("Couldn't update liked songs", true);
    } finally {
      setBusy(null);
    }
  };

  const openPlaylists = async () => {
    setView("playlists");
    setStatus(null);
    if (playlists) return;
    try {
      const res = await fetch("/api/playlists?type=created");
      const d = await res.json();
      if (!res.ok || !d?.success) throw new Error();
      setPlaylists(
        (d.createdPlaylists ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          isPublic: p.isPublic,
          songCount: p.songCount,
        }))
      );
    } catch {
      setPlaylists([]);
      flash("Couldn't load your playlists", true);
    }
  };

  const addToPlaylist = async (pl: { id: string; name: string }) => {
    setBusy(pl.id);
    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(pl.id)}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok) {
        setPlaylists((list) =>
          list ? list.map((p) => (p.id === pl.id ? { ...p, songCount: p.songCount + 1 } : p)) : list
        );
        flash(`Added to ${pl.name}`, false, true);
      } else if (d?.code === "DUPLICATE_SONG") {
        flash(`Already in ${pl.name}`, true);
      } else {
        flash(d?.error || "Couldn't add song", true);
      }
    } catch {
      flash("Couldn't add song", true);
    } finally {
      setBusy(null);
    }
  };

  const handleCache = async (e: React.MouseEvent) => {
    if (onToggleCache) {
      onToggleCache(e);
      return close();
    }
    setBusy("cache");
    try {
      const now = await toggleCacheSong(song, localCached);
      setLocalCached(now);
      flash(now ? "Saved for offline" : "Removed from offline", false, true);
    } catch (err: any) {
      flash(err?.message || "Couldn't save offline", true);
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    setBusy("remove");
    try {
      await onRemoveFromPlaylist?.();
      close();
    } catch {
      flash("Couldn't remove song", true);
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(song.url!);
      flash("Link copied", false, true);
    } catch {
      flash("Couldn't copy link", true);
    }
  };

  const triggerCls =
    variant === "row"
      ? "grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition hover:bg-white/10 hover:text-pri"
      : "rounded-full bg-black/45 p-1.5 text-white backdrop-blur-md transition-all hover:bg-black/70";

  const canLink = typeof song.url === "string" && /^https?:\/\//i.test(song.url);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        onKeyDown={stop}
        aria-label={`More options for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="More options"
        className={`${triggerCls} ${className} ${open ? "!opacity-100" : ""}`}
      >
        <EllipsisVertical size={variant === "row" ? 16 : 14} />
      </button>

      {open &&
        createPortal(
          <div onClick={stop} onKeyDown={stop} onPointerDown={stop}>
            <div
              ref={panelRef}
              role="menu"
              style={{ position: "fixed", top: pos.top, left: pos.left, width: PANEL_W, maxHeight: "min(20rem, 70vh)" }}
              className="z-[100] overflow-y-auto rounded-2xl border border-border-light bg-surface/95 p-1.5 shadow-lg backdrop-blur-xl"
            >
              {view === "main" ? (
                <>
                  <button role="menuitem" className={itemCls} disabled={!online} onClick={openPlaylists}>
                    <ListPlus size={15} className="text-accent" /> Add to playlist
                  </button>
                  <button role="menuitem" className={itemCls} disabled={!online || busy === "like"} onClick={handleLike}>
                    {busy === "like" ? (
                      <RefreshCw size={15} className="animate-spin text-accent" />
                    ) : (
                      <Heart size={15} className="text-accent" fill={liked ? "currentColor" : "none"} />
                    )}
                    {liked ? "Remove from liked songs" : "Add to liked songs"}
                  </button>
                  <button
                    role="menuitem"
                    className={itemCls}
                    disabled={cacheDisabled || busy === "cache"}
                    onClick={handleCache}
                  >
                    {busy === "cache" ? (
                      <RefreshCw size={15} className="animate-spin text-accent" />
                    ) : cached ? (
                      <BookmarkCheck size={15} className="text-accent" />
                    ) : (
                      <BookmarkPlus size={15} className="text-accent" />
                    )}
                    {cached ? "Remove from offline" : "Save offline"}
                  </button>
                  {canLink && (
                    <button role="menuitem" className={itemCls} onClick={copyLink}>
                      <Link2 size={15} className="text-accent" /> Copy link
                    </button>
                  )}
                  {onRemoveFromPlaylist && (
                    <button
                      role="menuitem"
                      className={`${itemCls} hover:!text-red-400`}
                      disabled={busy === "remove"}
                      onClick={handleRemove}
                    >
                      <Trash2 size={15} /> Remove from this playlist
                    </button>
                  )}
                  {!online && (
                    <p className="px-3 py-2 text-[11px] text-muted">You're offline. Some actions are unavailable.</p>
                  )}
                </>
              ) : (
                <>
                  <button className={`${itemCls} text-sec`} onClick={() => setView("main")}>
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    className={itemCls}
                    onClick={() => {
                      setShowCreate(true);
                      close();
                    }}
                  >
                    <Plus size={15} className="text-accent" /> New playlist
                  </button>
                  <div className="my-1 h-px bg-border" />
                  {playlists === null ? (
                    <div className="grid place-items-center py-4">
                      <RefreshCw size={16} className="animate-spin text-accent" />
                    </div>
                  ) : playlists.length === 0 ? (
                    <p className="px-3 py-3 text-[11px] text-muted">No playlists yet.</p>
                  ) : (
                    playlists.map((pl) => (
                      <button
                        key={pl.id}
                        className={itemCls}
                        disabled={busy === pl.id}
                        onClick={() => addToPlaylist(pl)}
                      >
                        {busy === pl.id ? (
                          <RefreshCw size={15} className="animate-spin text-accent" />
                        ) : pl.isPublic ? (
                          <Globe size={15} className="text-muted" />
                        ) : (
                          <Lock size={15} className="text-muted" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{pl.name}</span>
                        <span className="text-[10px] font-medium text-muted">{pl.songCount}</span>
                      </button>
                    ))
                  )}
                </>
              )}

              {status && (
                <p
                  role="status"
                  className={`mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold ${
                    status.error ? "bg-error/10 text-error" : "bg-success/10 text-success"
                  }`}
                >
                  {!status.error && <Check size={13} />}
                  {status.text}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}

      {showCreate &&
        createPortal(
          <div onClick={stop} onKeyDown={stop}>
            <CreatePlaylistModal
              onClose={() => setShowCreate(false)}
              onCreated={(created: any) => {
                setShowCreate(false);
                setPlaylists(null); // refetch next time
                void addToPlaylist({ id: created.id, name: created.name });
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
