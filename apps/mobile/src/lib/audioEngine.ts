import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer, AudioStatus } from "expo-audio";

let player: AudioPlayer | null = null;
let subscription: { remove: () => void } | null = null;

export async function initAudio() {
  try {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
  } catch (e) {
    console.warn("[audio] could not set audio mode", e);
  }
}

export function loadAndPlay(url: string, onStatus: (s: AudioStatus) => void) {
  subscription?.remove();
  if (player) player.replace(url);
  else player = createAudioPlayer(url);
  subscription = player.addListener("playbackStatusUpdate", onStatus);
  player.play();
}

export const playAudio = () => player?.play();
export const pauseAudio = () => player?.pause();
export const seekAudio = (sec: number) => player?.seekTo(sec);
export const audioIsPlaying = () => !!player?.playing;

export function releaseAudio() {
  subscription?.remove();
  subscription = null;
  player?.remove();
  player = null;
}