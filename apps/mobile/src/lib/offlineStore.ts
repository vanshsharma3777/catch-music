import { Platform } from "react-native";
import { useSyncExternalStore } from "react";
// SDK 53 ya purana ho to: import * as FS from "expo-file-system";
import * as FS from "expo-file-system/legacy";

type Entry = { id: string; file: string; song: any };

const DIR = (FS.documentDirectory ?? "") + "offline/";
const INDEX = DIR + "index.json";

let index: Record<string, Entry> = {};
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export async function ensureOfflineLoaded() {
  if (loaded || Platform.OS === "web") return;
  try {
    await FS.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
    const info = await FS.getInfoAsync(INDEX);
    if (info.exists) index = JSON.parse(await FS.readAsStringAsync(INDEX));
    loaded = true;
    emit();
  } catch {
    /* ignore */
  }
}

const persist = () => FS.writeAsStringAsync(INDEX, JSON.stringify(index));

/** song object me se audio link nikalta hai — apne data ke hisaab se field add kar sakte ho */
export function audioUrlOf(song: any): string | null {
  const d = song?.downloadUrl;
  if (Array.isArray(d) && d.length) {
    const best = d[d.length - 1];
    return best?.url ?? best?.link ?? null;
  }
  if (typeof d === "string") return d;
  return song?.audioUrl ?? song?.streamUrl ?? song?.media_url ?? null;
}

export function useIsCached(id: string | number | undefined) {
  return useSyncExternalStore(
    subscribe,
    () => !!index[String(id)],
    () => false
  );
}

/** player me offline file chalane ke liye: pehle ye check karo, mile to wahi uri play karo */
export function getOfflineUri(id: string | number): string | null {
  return index[String(id)]?.file ?? null;
}

/** returns new cached state */
export async function toggleOffline(song: any): Promise<boolean> {
  if (Platform.OS === "web") throw new Error("Only Works In Mobile Devices");
  await ensureOfflineLoaded();

  const id = String(song.id);
  const existing = index[id];

  if (existing) {
    await FS.deleteAsync(existing.file, { idempotent: true });
    delete index[id];
    await persist();
    emit();
    return false;
  }

  const url = audioUrlOf(song);
  if (!url) throw new Error("Is song ka audio link nahi mila");

  const file = DIR + id.replace(/[^a-zA-Z0-9_-]/g, "_") + ".mp3";
  const res = await FS.downloadAsync(url, file);
  if (res.status !== 200) {
    await FS.deleteAsync(file, { idempotent: true });
    throw new Error("Download fail ho gaya");
  }
  index[id] = { id, file, song };
  await persist();
  emit();
  return true;
}