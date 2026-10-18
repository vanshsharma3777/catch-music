import { Song } from "../types/songs";
import { getSongFingerprint } from "./getSongFingerprint";

          export async function deduplicateSongs(songs: Song[]) {
            const seen = new Set<string>();
            const uniqueSongs: Song[] = [];

            for (const song of songs) {
              const fingerprint = await getSongFingerprint(song);



              if (seen.has(fingerprint)) {

                continue;
              }

              seen.add(fingerprint);
              uniqueSongs.push(song);
            }

            return uniqueSongs;
          }
