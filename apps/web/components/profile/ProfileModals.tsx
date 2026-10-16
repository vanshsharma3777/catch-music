"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Globe, Lock, RefreshCw, Trash2, X } from "lucide-react";
import { CoverImage } from "../CoverImage";
import { api, errMsg, type PlaylistItem, type Profile } from "./shared";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // lock page scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        display: "flex",
        justifyContent: "center",
      }}
      className="items-end sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ position: "absolute", inset: 0 }}
        className="cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div
        style={{ position: "relative" }}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border-light bg-gradient-to-b from-surface to-card p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-pri">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-white/10 hover:text-pri"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

const inputClass =
  "w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-pri placeholder:text-muted focus:border-input-focus focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

/** Center-crops to a square and shrinks it so it fits the 400 KB limit enforced by /api/user/profile. */
async function fileToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not read that image."));
      i.src = url;
    });
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not process the image.");
    const side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const BIO_MAX = 160; // keep in sync with LIMITS.userBio on the server

/* ------------------------------------------------------------------ */
/* Edit profile                                                        */
/* ------------------------------------------------------------------ */
export function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [image, setImage] = useState(profile.image);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const changed = {
    name: name.trim() !== profile.name,
    username: username.trim().toLowerCase() !== profile.username,
    image: image.trim() !== profile.image,
    bio: bio.trim() !== profile.bio,
  };
  const dirty = Object.values(changed).some(Boolean);

  const pickFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      setImage(await fileToAvatar(file));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUser = username.trim().toLowerCase();
    if (!cleanName) return setError("Please enter your name.");
    if (cleanUser && !USERNAME_RE.test(cleanUser)) {
      return setError("Username must be 3-30 characters: letters, numbers and underscores only.");
    }

    if (bio.trim().length > BIO_MAX) return setError(`Bio can be at most ${BIO_MAX} characters.`);
    if (!dirty) return onClose();

    const body: Record<string, string> = {};
    if (changed.name) body.name = cleanName;
    if (changed.username) body.username = cleanUser;
    if (changed.image) body.image = image.trim();
    if (changed.bio) body.bio = bio.trim();

    setSaving(true);
    setError(null);
    try {
      const res = await api<{ user: Profile }>("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onSaved(res.user);
      onClose();
    } catch (err) {
      setError(errMsg(err));
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit profile" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">

              <CoverImage
                src={image}
                name={name || "Profile"}
                kind="singer"
                className={`h-24 w-24 rounded-full ring-2 ring-border-light transition-opacity ${
                  uploading ? "opacity-60" : ""
                }`}
              />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs text-sec">Upload a photo or paste an image link.</p>
            {image && (
              <button
                type="button"
                onClick={() => setImage("")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-error"
              >
                <Trash2 size={13} /> Remove photo
              </button>
            )}
          </div>
        </div>

        <Field label="Image link (optional)">
          <input
            value={image.startsWith("data:") ? "" : image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>

        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Your name"
            className={inputClass}
          />
        </Field>

        <Field label="Username" hint="3-30 characters. Letters, numbers and underscores.">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={30}
              placeholder="username"
              autoCapitalize="none"
              autoCorrect="off"
              className={`${inputClass} pl-8`}
            />
          </div>
        </Field>

        <Field label="Bio (optional)" hint={`${bio.length}/${BIO_MAX}`}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={BIO_MAX}
            rows={3}
            placeholder="Tell people what you like to listen to"
            className={`${inputClass} resize-none`}
          />
        </Field>

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
            disabled={saving || uploading || !dirty}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-bg transition hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
          >
            {saving && <RefreshCw size={15} className="animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Create playlist                                                     */
/* ------------------------------------------------------------------ */
export function CreatePlaylistModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: PlaylistItem) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give your playlist a name.");
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ playlist: PlaylistItem }>("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), isPublic }),
      });
      onCreated(res.playlist);
      onClose();
    } catch (err) {
      setError(errMsg(err));
      setSaving(false);
    }
  };

  return (
    <Modal title="Create playlist" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="My late night mix"
            className={inputClass}
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What is this playlist about?"
            className={`${inputClass} resize-none`}
          />
        </Field>

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
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-bg transition hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
          >
            {saving && <RefreshCw size={15} className="animate-spin" />}
            {saving ? "Creating..." : "Create playlist"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
