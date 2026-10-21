import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

import type { EngineStatus } from "../types/player";

type Listener = (s: EngineStatus) => void;

let player: AudioPlayer | null = null;
let listener: Listener | null = null;

let currentVolume = 1;

function get(): AudioPlayer {
  if (player) return player;

  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
  }).catch(() => {});

  player = createAudioPlayer(null, {
    updateInterval: 500,
  });

  player.volume = currentVolume;

  player.addListener("playbackStatusUpdate", (st: any) => {
    listener?.({
      position: Number(st.currentTime) || 0,
      duration: Number(st.duration) || 0,
      playing: !!st.playing,
      buffering: !!st.isBuffering,
      ended: !!st.didJustFinish,
    });
  });

  return player;
}

export const engine = {
  onStatus(fn: Listener | null) {
    listener = fn;
  },

  load(
    uri: string,
    meta?: {
      title: string;
      artist: string;
      artwork?: string;
    }
  ) {
    const p = get();

    p.replace({ uri });

    // Preserve the selected volume when changing songs.
    p.volume = currentVolume;

    p.play();

    try {
      p.setActiveForLockScreen(true, {
        title: meta?.title,
        artist: meta?.artist,
        artworkUrl: meta?.artwork,
      });
    } catch {
      // Lock screen controls are optional.
    }
  },

  play() {
    get().play();
  },

  pause() {
    get().pause();
  },

  seek(seconds: number) {
    return get().seekTo(Math.max(0, seconds));
  },

  stop() {
    const p = get();

    p.pause();
    p.seekTo(0);
  },

  setVolume(volume: number) {
    currentVolume = Math.max(0, Math.min(1, volume));

    get().volume = currentVolume;
  },

  getVolume() {
    return currentVolume;
  },
};