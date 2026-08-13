import { Song } from "../types/songs";
import { normalizeSongName } from "./normaliseSongName";

export function getSongFingerprint(song: Song) {
  const name = normalizeSongName(song.name);

  const artists =
    song.artists?.primary
      ?.map((artist) => artist.name.toLowerCase().trim())
      .sort()
      .join("|") ?? "";

  return [
    name,
    artists,
    song.duration,
    song.label?.toLowerCase().trim(),
  ].join("::");
}
