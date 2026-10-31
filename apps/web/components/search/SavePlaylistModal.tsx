"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Globe, Lock, RefreshCw, RotateCcw, X } from "lucide-react";
import type { Song } from "../../app/types/songs";

const inputClass =
  "w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-pri placeholder:text-muted focus:border-input-focus focus:outline-none";

export default function SavePlaylistModal({
  originalName,
  image,
  songs,
  onClose,
  onSaved,
}: {
  originalName: string;
  image?: string;
  songs: Song[];
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(originalName);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) return setError("Please enter a playlist name.");

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/playlists/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          image: image || undefined,
          isPublic,
          songs,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Couldn't save this playlist. Please try again.");
      }
      onSaved(finalName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save playlist"
      style={{ position: "fixed", inset: 0, zIndex: 2147483000, display: "flex", justifyContent: "center" }}
      className="items-end sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => !saving && onClose()}
        style={{ position: "absolute", inset: 0 }}
        className="cursor-default bg-black/70 backdrop-blur-sm"
      />

      <form
        onSubmit={submit}
        style={{ position: "relative" }}
        className="max-h-[92dvh] w-full max-w-md space-y-5 overflow-y-auto rounded-t-3xl border border-border-light bg-gradient-to-b from-surface to-card p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-pri">Save playlist</h2>
            <p className="text-xs text-sec">
              {songs.length} {songs.length === 1 ? "song" : "songs"} will be added to your library
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-white/10 hover:text-pri"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Playlist name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Name your playlist"
            className={inputClass}
          />
          <span className="flex items-center justify-between text-[11px] text-muted">
            <span>Keep the original name or type your own.</span>
            {name !== originalName && (
              <button
                type="button"
                onClick={() => setName(originalName)}
                className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
              >
                <RotateCcw size={11} /> Use original
              </button>
            )}
          </span>
        </label>

        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl border border-border-light bg-bg-ter p-3.5 text-left transition hover:bg-surface"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
            {isPublic ? <Globe size={17} /> : <Lock size={17} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-pri">{isPublic ? "Public" : "Private"}</span>
            <span className="block text-xs text-sec">
              {isPublic ? "Anyone can find and save this playlist." : "Only you can see this playlist."}
            </span>
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isPublic ? "bg-accent" : "bg-white/15"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isPublic ? "left-[22px]" : "left-0.5"}`}
            />
          </span>
        </button>

        {error && (
          <p role="alert" className="rounded-xl border border-error/30 bg-error/10 px-3.5 py-2.5 text-xs text-error">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-border-light bg-bg-ter py-3 text-sm font-semibold text-sec transition hover:bg-surface hover:text-pri disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-bg transition hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
          >
            {saving && <RefreshCw size={15} className="animate-spin" />}
            {saving ? "Saving..." : "Save playlist"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}