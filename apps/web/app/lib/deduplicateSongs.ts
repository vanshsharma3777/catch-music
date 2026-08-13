import { Song } from "../types/songs";
import { getSongFingerprint } from "./getSongFingerprint";

          export async function deduplicateSongs(songs: Song[]) {
            const seen = new Set<string>();
            const uniqueSongs: Song[] = [];

            for (const song of songs) {
              const fingerprint = await getSongFingerprint(song);

              console.log("ran get fingerprint for song:", song.name);
              console.log("fingerprint:", fingerprint);

              if (seen.has(fingerprint)) {
                console.log("DUPLICATE:", song.name);
                continue;
              }

              seen.add(fingerprint);
              uniqueSongs.push(song);
            }

            return uniqueSongs;
          }
