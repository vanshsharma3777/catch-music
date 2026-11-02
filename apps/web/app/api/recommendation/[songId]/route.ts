export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getRecommendations } from "@repo/recommendation";
import { getUser } from "../../../lib/getUser";
import { redis } from "../../../lib/config/redis";
import { storeSongs } from "../../../lib/storeSongs";
import type { Song } from "../../../types/songs";

const PLAYABLE_TTL = 60 * 60 * 6; // 6h

/** Full, playable song (downloadUrl + image) straight from the music API. */
async function loadPlayable(id: string): Promise<Song | null> {
  const key = `song:playable:${id}`;
  try {
    const hit = await redis.get<Song>(key);
    if (hit) return hit;
  } catch {}

  try {
    const res = await axios.get(
      `${process.env.JIO_SAVAAN}/api/songs/${encodeURIComponent(id)}`,
      { timeout: 8000 }
    );
    const d = res.data?.data;
    const song = (Array.isArray(d) ? d[0] : d?.songs?.[0]) as Song | undefined;
    if (!song?.id) return null;
    try {
      await redis.set(key, song, { ex: PLAYABLE_TTL });
    } catch {}
    return song;
  } catch {
    return null;
  }
}

/** Song has no embedding yet: send it to the worker so it works next time. */
async function queueForEmbedding(songId: string) {
  try {
    const first = await redis.set(`song:queued:${songId}`, 1, { nx: true, ex: 600 });
    if (!first) return;
    const full = await loadPlayable(songId);
    if (full) await storeSongs([full]);
  } catch (err) {
    console.error("queueForEmbedding failed:", err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const user = await getUser(req); // works for web cookie AND mobile Bearer token
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { songId } = await params;
    if (!songId || typeof songId !== "string") {
      return NextResponse.json({ success: false, message: "Invalid song ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 10, 1), 30);
    const excludeIds: string[] = Array.isArray(body?.excludeIds)
      ? body.excludeIds.filter((v: unknown): v is string => typeof v === "string").slice(0, 200)
      : [];

    const recommendations = await getRecommendations({ songId, limit, excludeIds });

    if (!recommendations.length) {
      void queueForEmbedding(songId);
      return NextResponse.json({ success: true, data: [] });
    }

    const songs = await Promise.all(recommendations.map((r) => loadPlayable(r.songId)));
    const playable = songs.filter((s): s is Song => !!s && !!s.id);

    return NextResponse.json({ success: true, data: playable });
  } catch (error) {
    console.error("Recommendation API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}