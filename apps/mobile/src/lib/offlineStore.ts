import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import { getAudioUrl } from "./songHelpers";
import { readJson, writeJson } from "./storage";
import type { Song } from "../types/song";

const KEY = "catchmusic_offline_v2";
const MIN_BYTES = 10_000; // anything smaller is an error page, not a song

export type OfflineEntry = { id: string; fileName: string; song: Song; bytes: number; savedAt: number };

let index: Record<string, OfflineEntry> = {};
let songs: Song[] = [];
const downloading = new Set<string>();
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  songs = Object.values(index)
    .sort((a, b) => b.savedAt - a.savedAt)
    .map((e) => e.song);
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const offlineDir = () => new Directory(Paths.document, "offline");
const fileOf = (e: Pick<OfflineEntry, "fileName">) => new File(offlineDir(), e.fileName);
const persist = () => void writeJson(KEY, index);
const extOf = (url: string) => url.match(/\.(mp3|mp4|m4a|aac)(\?|#|$)/i)?.[0].match(/\.\w+/)?.[0] ?? ".mp4";

export function ensureOfflineLoaded(): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  loadPromise ??= (async () => {
    const stored = await readJson<Record<string, OfflineEntry>>(KEY);
    if (stored) {
      const next: Record<string, OfflineEntry> = {};
      for (const [id, e] of Object.entries(stored)) {
        try {
          if (fileOf(e).exists) next[id] = e;
        } catch {}
      }
      index = next;
    }
    emit();
  })();
  return loadPromise;
}

/** Local file:// uri if the song is saved on this device, otherwise null. */
export function getOfflineUri(id: string | number | undefined): string | null {
  const e = index[String(id)];
  if (!e) return null;
  try {
    const f = fileOf(e);
    return f.exists ? f.uri : null;
  } catch {
    return null;
  }
}

/** Returns the new saved state. Throws a readable Error on failure. */
export async function toggleOffline(song: Song): Promise<boolean> {
  if (Platform.OS === "web") throw new Error("Offline saving works only in the mobile app.");
  await ensureOfflineLoaded();

  const id = String(song.id);
  const existing = index[id];

  if (existing) {
    try {
      const f = fileOf(existing);
      if (f.exists) f.delete();
    } catch {}
    delete index[id];
    persist();
    emit();
    return false;
  }

  if (downloading.has(id)) throw new Error("This song is already downloading.");
  const url = getAudioUrl(song);
  if (!url) throw new Error("This song has no downloadable audio.");

  downloading.add(id);
  emit();

  const fileName = `${id.replace(/[^a-zA-Z0-9_-]/g, "_")}${extOf(url)}`;
  const dir = offlineDir();
  dir.create({ intermediates: true, idempotent: true });
  const target = new File(dir, fileName);

  try {
    if (target.exists) target.delete();
    const out = await File.downloadFileAsync(url, target);
    if (!out.exists || out.size < MIN_BYTES) throw new Error("The download was incomplete. Please try again.");
    index[id] = { id, fileName, song, bytes: out.size, savedAt: Date.now() };
    persist();
    return true;
  } catch (e) {
    try {
      if (target.exists) target.delete();
    } catch {}
    throw e instanceof Error && e.message.includes("incomplete")
      ? e
      : new Error("Couldn't download this song. Check your connection and try again.");
  } finally {
    downloading.delete(id);
    emit();
  }
}

export function useIsCached(id: string | number | undefined) {
  return useSyncExternalStore(subscribe, () => !!index[String(id)], () => false);
}

export function useIsDownloading(id: string | number | undefined) {
  return useSyncExternalStore(subscribe, () => downloading.has(String(id)), () => false);
}

/** For the Offline tab (next step). Newest first. */
export function useOfflineSongs(): Song[] {
  return useSyncExternalStore(subscribe, () => songs, () => songs);
}