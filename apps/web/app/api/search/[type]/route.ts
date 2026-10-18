import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { authOptions } from "../../../lib/config/authOptions";
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";
import { storeArtists } from "../../../lib/storeArtists";
import { storeSongs } from "../../../lib/storeSongs";
import { storeAlbums } from "../../../lib/storeAlbums";
import { Song } from "../../../types/songs";
import { deduplicateSongs } from "../../../lib/deduplicateSongs";
import { redis } from "../../../lib/config/redis";
import { getUser } from "../../../lib/getUser";

const MAX_LIMIT = 50; // hard cap so a client can't ask for huge pages

// Redis key for a songs search.
// Page 1 keeps the old key so songs you already cached stay valid.
const songsCacheKey = (normalizedQuery: string, page: number) =>
  page <= 1 ? `songs:${normalizedQuery}` : `songs:${normalizedQuery}:p${page}`;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string }> },
) {
  const { type } = await context.params;
  if (!type || type.trim().length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "Params not found!",
      },
      { status: 401 },
    );
  }
  console.log("params :", type);

  const session = await getUser(request);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized!",
      },
      { status: 400 },
    );
  }

  try {
    const email = session.user?.email;
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "User email not found! Login again",
        },
        { status: 400 },
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUser.length === 0) {
      console.log("User not found");
      return NextResponse.json(
        {
          success: false,
          error: "User email not found! Login again",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { query } = body;
    const rawLimit = Number(body.limit);

    if (!query || query.trim().length === 0 || isNaN(rawLimit)) {
      return NextResponse.json(
        {
          success: false,
          error: "Query not found",
        },
        { status: 401 },
      );
    }

    const limit = Math.min(Math.max(1, Math.floor(rawLimit)), MAX_LIMIT);

    // The client sends a 1-based page. Missing/invalid page = 1 (old behaviour).
    const rawPage = Number(body.page);
    const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
    // JioSaavn-style APIs count pages from 0. If your upstream counts from 1,
    // change this to `const upstreamPage = page;`
    const upstreamPage = page - 1;

    console.log("came in /search/type");

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = songsCacheKey(normalizedQuery, page);

    if (type === "songs") {
      const cachedSongs = await redis.get<Song[]>(cacheKey);

      if (cachedSongs) {
        console.log("Redis HIT:", cacheKey);

        return NextResponse.json({
          success: true,
          data: cachedSongs,
          source: "redis",
        });
      }

      console.log("Redis MISS:", cacheKey);
    }

    console.log("Making API call for new songs");

    const res = await axios.get(
      `${process.env.JIO_SAVAAN}/api/search/${type}?query=${encodeURIComponent(query.trim())}&limit=${limit}&page=${upstreamPage}`,
    );
    const data = res.data;

    if (type === "artists") {
      console.log("hit this ");
      storeArtists(data.data.results[0].id);
      return NextResponse.json({
        success: true,
        data: data.data.results[0],
      });
    } else if (type === "songs") {
      const finalSongs = data.data.results ?? [];
      console.log("calling storeSongs worker");

      const filteredSongs = await deduplicateSongs(finalSongs);

      // Don't cache an empty page: it may be a temporary upstream hiccup.
      if (filteredSongs.length > 0) {
        await redis.set(cacheKey, filteredSongs, {
          ex: 60 * 60 * 24 * 7,
        });
        console.log("Redis SET:", cacheKey);
      }

      storeSongs(filteredSongs);
      return NextResponse.json({
        success: true,
        data: filteredSongs,
      });
    } else if (type === "albums") {
      console.log("inside album function");
      const finalAlbums = data.data.results;
      console.log("albums sending to worker", finalAlbums);
      storeAlbums(finalAlbums);
      return NextResponse.json({
        success: true,
        data: finalAlbums,
      });
    }
    return NextResponse.json({
      success: true,
      data: data.data.results,
    });
  } catch (error: any) {
    console.log("Error in /api/search :", error);
    return NextResponse.json({
      success: false,
      error: "internal server error",
    });
  }
}
