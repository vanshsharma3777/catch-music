import type { Song } from "../types/song";

type Handler = (song: Song, queue: Song[]) => void;
let handler: Handler | null = null;

export const registerPlayHandler = (h: Handler | null) => {
  handler = h;
};

export function playSong(song: Song, queue: Song[] = [song]) {
  if (!handler) {
    console.warn("[playerBridge] No player registered yet. Call registerPlayHandler() in your PlayerProvider.");
    return;
  }
  handler(song, queue);
}