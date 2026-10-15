import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { authOptions } from "../../lib/config/authOptions";

const BASE = process.env.JIO_SAVAAN;
const TIMEOUT_MS = 8000;
const MAX_MEMO = 400;
const memo = new Map<string, { exp: number; value: any }>();

async function upstream(
  path: string,
  params: Record<string, string | number>,
  ttlMs: number,
) {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const url = `${BASE}${path}${qs ? `?${qs}` : ""}`;

  const hit = memo.get(url);
  if (hit && hit.exp > Date.now()) return hit.value;

  const res = await axios.get(url, { timeout: TIMEOUT_MS });
  const value = res.data?.data;
  memo.set(url, { exp: Date.now() + ttlMs, value });
  if (memo.size > MAX_MEMO) memo.delete(memo.keys().next().value as string);
  return value;
}

const clean = (v: string | null) => (v ?? "").trim().slice(0, 100);
const SEARCH_TYPES = new Set(["songs", "albums", "artists", "playlists"]);
const DETAIL_TYPES = new Set(["songs", "album", "playlist", "artist"]);
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized!" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const mode = sp.get("mode");

  try {
    if (mode === "suggest") {
      const q = clean(sp.get("q"));
      if (q.length < 2) {
        return NextResponse.json({
          success: true,
          data: { songs: [], albums: [], artists: [], playlists: [] },
        });
      }
      const d = await upstream("/api/search", { query: q }, 5 * 60_000);
      return NextResponse.json({
        success: true,
        data: {
          songs: d?.songs?.results ?? [],
          albums: d?.albums?.results ?? [],
          artists: d?.artists?.results ?? [],
          playlists: d?.playlists?.results ?? [],
        },
      });
    }

    if (mode === "search") {
      const q = clean(sp.get("q"));
      const type = sp.get("type") ?? "";
      if (!q || !SEARCH_TYPES.has(type)) {
        return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
      }
      const page = Math.max(0, Number(sp.get("page")) || 0);
      const limit = Math.min(40, Math.max(1, Number(sp.get("limit")) || 20));
      const d = await upstream(`/api/search/${type}`, { query: q, page, limit }, 10 * 60_000);
      return NextResponse.json({
        success: true,
        data: { results: d?.results ?? [], total: d?.total ?? 0 },
      });
    }

    if (mode === "detail") {
      const type = sp.get("type") ?? "";
      const id = sp.get("id") ?? "";
      if (!DETAIL_TYPES.has(type) || !ID_RE.test(id)) {
        return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
      }

      let songs: any[] = [];
      let name: string | undefined;

      if (type === "songs") {
        const d = await upstream(`/api/songs/${id}`, {}, 30 * 60_000);
        songs = Array.isArray(d) ? d : [];
      } else if (type === "album") {
        const d = await upstream("/api/albums", { id }, 30 * 60_000);
        songs = d?.songs ?? [];
        name = d?.name;
      } else if (type === "playlist") {
        const d = await upstream("/api/playlists", { id, limit: 100 }, 30 * 60_000);
        songs = d?.songs ?? [];
        name = d?.name;
      } else {
        const d = await upstream(`/api/artists/${id}/songs`, { page: 0 }, 30 * 60_000);
        songs = d?.songs ?? [];
      }

      return NextResponse.json({ success: true, data: { songs, name } });
    }

    return NextResponse.json({ success: false, error: "Unknown mode" }, { status: 400 });
  } catch (err: any) {
    console.error("[/api/discover]", err?.message || err);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 502 });
  }
}
