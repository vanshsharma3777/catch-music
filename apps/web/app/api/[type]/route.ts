// app/api/search/[type]/route.ts
import { NextRequest, NextResponse, after } from "next/server";
import axios from "axios";
import { Song } from "../../types/songs";
import { deduplicateSongs } from "../../lib/deduplicateSongs";
import { db, users } from "@repo/db";
import { redis } from "../../lib/config/redis";
import { eq } from "drizzle-orm";
import { authOptions } from "../../lib/config/authOptions";
import { storeAlbums } from "../../lib/storeAlbums";
import { storeArtists } from "../../lib/storeArtists";
import { storeSongs } from "../../lib/storeSongs";
import { getUser } from "../../lib/getUser";

const SONGS_UPSTREAM_LIMIT = 25;
const SONGS_TTL_SECONDS = 60 * 60 * 24 * 7;
const UPSTREAM_TIMEOUT_MS = 10_000;

const inflightSongs = new Map<string, Promise<Song[]>>();

async function fetchSongsUpstream(query: string): Promise<Song[]> {
  const res = await axios.get(
    `${process.env.JIO_SAVAAN}/api/search/songs?query=${encodeURIComponent(query)}&limit=${SONGS_UPSTREAM_LIMIT}`,
    { timeout: UPSTREAM_TIMEOUT_MS },
  );
  return deduplicateSongs(res.data.data.results);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string }> },
) {
  const { type } = await context.params;
  if (!type || type.trim().length === 0) {
    return NextResponse.json({ success: false, error: "Params not found!" }, { status: 401 });
  }

  const session = await getUser(request);
  const email = session?.user?.email;
  if (!session || !email) {
    return NextResponse.json({ success: false, error: "Unauthorized!" }, { status: 400 });
  }

  try {
    const { query, limit } = await request.json();
    if (!query || query.trim().length === 0 || isNaN(limit)) {
      return NextResponse.json({ success: false, error: "Query not found" }, { status: 401 });
    }

    const trimmed = query.trim();
    const normalizedQuery = trimmed.toLowerCase();
    const cacheKey = `songs:v2:${normalizedQuery}`;

    // Run the user check and the Redis lookup at the same time
    // (previously the DB query finished first, adding a full round trip).
    const [existingUser, cachedSongs] = await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1),
      type === "songs" ? redis.get<Song[]>(cacheKey) : Promise.resolve(null),
    ]);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "User email not found! Login again" },
        { status: 400 },
      );
    }

    if (type === "songs") {
      if (cachedSongs) {
        return NextResponse.json({
          success: true,
          data: cachedSongs.slice(0, Number(limit)),
          source: "redis",
        });
      }

      let pending = inflightSongs.get(cacheKey);
      if (!pending) {
        pending = fetchSongsUpstream(trimmed).finally(() => inflightSongs.delete(cacheKey));
        inflightSongs.set(cacheKey, pending);
      }
      const songs = await pending;

      // Respond now; write Redis + queue the DB job after the response is sent.
      after(async () => {
        try {
          await redis.set(cacheKey, songs, { ex: SONGS_TTL_SECONDS });
          await storeSongs(songs);
        } catch (err) {
          console.error("Post-response song caching failed:", err);
        }
      });

      return NextResponse.json({
        success: true,
        data: songs.slice(0, Number(limit)),
        source: "upstream",
      });
    }

    const res = await axios.get(
      `${process.env.JIO_SAVAAN}/api/search/${type}?query=${encodeURIComponent(trimmed)}&limit=${limit}`,
      { timeout: UPSTREAM_TIMEOUT_MS },
    );
    const data = res.data;

    if (type === "artists") {
      after(() => {
        storeArtists(data.data.results[0].id);
      });
      return NextResponse.json({ success: true, data: data.data.results[0] });
    }

    if (type === "albums") {
      const finalAlbums = data.data.results;
      after(() => {
        storeAlbums(finalAlbums);
      });
      return NextResponse.json({ success: true, data: finalAlbums });
    }

    return NextResponse.json({ success: true, data: data.data.results });
  } catch (error: any) {
    console.error("Error in /api/search:", error?.message || error);
    return NextResponse.json({ success: false, error: "internal server error" });
  }
}
