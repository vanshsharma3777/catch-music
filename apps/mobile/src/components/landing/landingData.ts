import { Feather } from "@expo/vector-icons";

export type FeatherIcon = keyof typeof Feather.glyphMap;

export type Perk = { icon: FeatherIcon; label: string };
export type Feature = { icon: FeatherIcon; title: string; tag: string; text: string };
export type Step = { icon: FeatherIcon; title: string; text: string };
export type DemoSong = { title: string; artist: string };

export const TICKER = [
  "Offline playback",
  "Zero ads",
  "No premium needed",
  "Likes & playlists",
  "Smart storage",
];

export const PERKS: Perk[] = [
  { icon: "wifi-off", label: "Offline\nready" },
  { icon: "slash", label: "Zero\nads" },
  { icon: "unlock", label: "No premium\nneeded" },
];

export const FEATURES: Feature[] = [
  {
    icon: "zap",
    title: "Instant Caching",
    tag: "One tap. Done forever.",
    text: "Save any song you play for offline listening. No re-downloading until you choose to delete it.",
  },
  {
    icon: "wifi-off",
    title: "Works Without Internet",
    tag: "Metro, flights, treks.",
    text: "Saved songs play straight from your device, even with zero signal.",
  },
  {
    icon: "heart",
    title: "Likes & Playlists",
    tag: "Your library, your way.",
    text: "Like songs, build playlists, and save public playlists from other listeners.",
  },
  {
    icon: "hard-drive",
    title: "Smart Storage",
    tag: "We've got your back.",
    text: "We check your free space before saving, so your device never runs out unexpectedly.",
  },
];

export const STEPS: Step[] = [
  { icon: "play", title: "Play a song", text: "Stream anything you love from the catalog." },
  { icon: "bookmark", title: "Save it", text: "Tap the bookmark to store it on your device." },
  { icon: "shield", title: "Stored privately", text: "Files stay on your phone, nowhere else." },
  { icon: "headphones", title: "Listen offline", text: "Press play anywhere. No network needed." },
];

export const DEMO_SONGS: DemoSong[] = [
  { title: "Aari Aari", artist: "Dhurandhar 2" },
  { title: "Tera Mera Rishta", artist: "Awarapan 2" },
  { title: "Your next favourite", artist: "Saved with one tap" },
];