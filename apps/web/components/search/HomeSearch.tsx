"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Play,
  Pause,
  Clock,
  ArrowLeft,
  BookmarkPlus,
  BookmarkCheck,
  RefreshCw,
  ChevronRight,
  CornerDownLeft,
} from "lucide-react";
import { usePlayer, formatAudioTime } from "../player/PlayerContext";
import { Song } from "../../app/types/songs";
import { CoverImage } from "../CoverImage";
import {
  EntityType,
  Mini,
  MiniType,
  SuggestResult,
  fetchSuggest,
  getDetail,
  getSongById,
  matchScore,
  peekSuggest,
  pickImage,
  rankBy,
  searchEntities,
  searchSongs,
} from "../../app/lib/discoverClient";

const RECENT_KEY = "catchmusic_recent_searches";
const PAGE_SIZE = 24;
const DEBOUNCE_DELAY = 350;

type Tab = "all" | "songs" | "albums" | "artists" | "playlists";

interface DetailState {
  type: EntityType;
  mini: Mini;
  songs: Song[];
  loading: boolean;
}

export interface HomeSearchProps {
  onActiveChange: (active: boolean) => void;
  cachedSongIds: Set<string>;
  cachingIds: Set<string>;
  isCachingAny: boolean;
  onToggleCache: (e: React.MouseEvent, song: Song) => void;
}

const artistOf = (s: Song) =>
  s.artists?.primary?.map((a) => a.name).join(", ") || s.primaryArtists || s.artistName || "";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({ text, q }: { text: string; q: string }) {
  const tokens = q.trim().split(/\s+/).filter(Boolean).map(escapeRe);
  if (tokens.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${tokens.join("|")})`, "ig"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-transparent font-extrabold text-accent">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function SuggestRow({
  mini,
  q,
  selected,
  busy,
  best,
  onPick,
}: {
  mini: Mini;
  q: string;
  selected: boolean;
  busy: boolean;
  best: boolean;
  onPick: () => void;
}) {
  const round = mini.type === "artist";
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
        selected ? "bg-white/10" : "hover:bg-white/[0.06]"
      }`}
    >
      <CoverImage
        src={mini.image}
        name={mini.title}
        kind={round ? "singer" : "song"}
        className={`h-10 w-10 shrink-0 ${round ? "rounded-full" : "rounded-lg"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-pri">
          <Highlight text={mini.title} q={q} />
          {best && (
            <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 align-middle text-[10px] font-bold text-accent">
              Best match
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-muted">{mini.subtitle}</span>
      </span>
      {mini.type === "song" ? (
        busy ? (
          <RefreshCw size={16} className="animate-spin text-accent" />
        ) : (
          <Play size={16} className="text-sec" fill="currentColor" />
        )
      ) : (
        <ChevronRight size={16} className="text-muted" />
      )}
    </button>
  );
}

function SongRow({
  song,
  index,
  playing,
  isCached,
  isCaching,
  disableCache,
  onPlay,
  onToggleCache,
}: {
  song: Song;
  index: number;
  playing: boolean;
  isCached: boolean;
  isCaching: boolean;
  disableCache: boolean;
  onPlay: () => void;
  onToggleCache: (e: React.MouseEvent) => void;
}) {
  const title = song.name || song.title || "Untitled";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => e.key === "Enter" && onPlay()}
      aria-label={`Play ${title}`}
      className={`group flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-accent ${
        playing ? "bg-accent/10" : ""
      }`}
    >
      <span className="hidden w-5 text-center text-xs tabular-nums text-muted sm:block">
        {index + 1}
      </span>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)]">
        <CoverImage
          src={pickImage(song.image, "thumb")}
          name={title}
          className="h-full w-full"
        />
        <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {playing ? (
            <Pause size={18} fill="white" className="text-white" />
          ) : (
            <Play size={18} fill="white" className="text-white" />
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${playing ? "text-accent" : "text-pri"}`}>
          {title}
        </p>
        <p className="truncate text-xs text-muted">{artistOf(song) || "Unknown artist"}</p>
      </div>
      <span className="hidden text-xs tabular-nums text-muted sm:block">
        {song.duration ? formatAudioTime(song.duration) : ""}
      </span>
      <button
        type="button"
        onClick={onToggleCache}
        disabled={disableCache}
        aria-label={isCached ? "Remove from offline" : "Save offline"}
        title={isCaching ? "Downloading..." : isCached ? "Saved offline" : "Save offline"}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
          isCached ? "bg-accent text-bg" : "text-sec hover:bg-white/10 hover:text-pri"
        }`}
      >
        {isCaching ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : isCached ? (
          <BookmarkCheck size={14} />
        ) : (
          <BookmarkPlus size={14} />
        )}
      </button>
    </div>
  );
}

function EntityCard({ m, onOpen }: { m: Mini; onOpen: () => void }) {
  const round = m.type === "artist";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group rounded-3xl p-2.5 text-left transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div
        className={`aspect-square w-full overflow-hidden shadow-[0_12px_30px_-14px_rgba(0,0,0,0.8)] ${
          round ? "rounded-full" : "rounded-2xl"
        }`}
      >
        <CoverImage
          src={m.image}
          name={m.title}
          kind={round ? "singer" : "song"}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <p className={`mt-3 truncate px-1 text-sm font-bold text-pri ${round ? "text-center" : ""}`}>
        {m.title}
      </p>
      <p className={`truncate px-1 text-xs text-muted ${round ? "text-center" : ""}`}>
        {m.subtitle}
      </p>
    </button>
  );
}

function SectionTitle({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-lg font-extrabold tracking-tight text-pri">{title}</h3>
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          See all <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function RowSkeleton({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-2.5 py-2">
          <div className="h-12 w-12 rounded-xl bg-white/[0.07]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-white/[0.07]" />
            <div className="h-3 w-1/3 rounded bg-white/[0.07]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomeSearch({
  onActiveChange,
  cachedSongIds,
  cachingIds,
  isCachingAny,
  onToggleCache,
}: HomeSearchProps) {
  const player = usePlayer();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggest, setSuggest] = useState<SuggestResult | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [pickingId, setPickingId] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Mini[]>([]);
  const [artists, setArtists] = useState<Mini[]>([]);
  const [playlists, setPlaylists] = useState<Mini[]>([]);
  const [songPage, setSongPage] = useState(0);
  const [moreSongs, setMoreSongs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detail, setDetail] = useState<DetailState | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const detailRunRef = useRef(0);

  const goBack = () => {
    runRef.current++;
    setQuery("");
    setSubmitted(null);
    setDetail(null);
    setSuggest(null);
    setOpen(false);
  };

  useEffect(() => {
    onActiveChange(!!submitted || !!detail);
  }, [submitted, detail, onActiveChange]);

  // recent searches
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  // press "/" anywhere to jump into the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const saveRecent = (q: string) => {
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
  };

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced autocomplete: wait until typing pauses, and abort stale requests.
  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      abortRef.current?.abort();
      abortRef.current = null;
      setSuggest(null);
      setSuggestLoading(false);
      setActiveIdx(-1);
      return;
    }

    // Cached suggestions do not need a network request.
    const cached = peekSuggest(q);
    if (cached) {
      abortRef.current?.abort();
      abortRef.current = null;
      setSuggest(cached);
      setSuggestLoading(false);
      setActiveIdx(-1);
      return;
    }

    const controller = new AbortController();
    setSuggestLoading(true);

    const timer = window.setTimeout(async () => {
      // The previous effect's cleanup aborts its request as soon as the query changes.
      abortRef.current?.abort();
      abortRef.current = controller;

      try {
        const result = await fetchSuggest(q, controller.signal);
        if (!controller.signal.aborted) {
          setSuggest(result);
          setActiveIdx(-1);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggest(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSuggestLoading(false);
        }
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    };
  }, [query]);

  const ranked = useMemo(() => {
    const q = query.trim();
    if (!suggest) return null;
    return {
      songs: rankBy(suggest.songs, q, (m) => m.title, (m) => m.subtitle).slice(0, 5),
      artists: rankBy(suggest.artists, q, (m) => m.title).slice(0, 3),
      albums: rankBy(suggest.albums, q, (m) => m.title).slice(0, 3),
      playlists: rankBy(suggest.playlists, q, (m) => m.title).slice(0, 3),
    };
  }, [suggest, query]);

  type NavItem = { kind: MiniType | "all"; m?: Mini };
  const navItems = useMemo<NavItem[]>(() => {
    if (!ranked) return [];
    return [
      ...ranked.songs.map((m) => ({ kind: "song" as const, m })),
      ...ranked.artists.map((m) => ({ kind: "artist" as const, m })),
      ...ranked.albums.map((m) => ({ kind: "album" as const, m })),
      ...ranked.playlists.map((m) => ({ kind: "playlist" as const, m })),
      { kind: "all" as const },
    ];
  }, [ranked]);

  const bestSongId =
    ranked?.songs[0] && matchScore(ranked.songs[0].title, query) >= 85 ? ranked.songs[0].id : null;

  const runSearch = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const id = ++runRef.current;

    setSubmitted(text);
    setDetail(null);
    setOpen(false);
    setTab("all");
    setLoading(true);
    setSongs([]);
    setAlbums([]);
    setArtists([]);
    setPlaylists([]);
    setSongPage(0);
    setMoreSongs(false);
    saveRecent(text);

    const fresh = () => id === runRef.current;

    await Promise.allSettled([
      searchSongs(text, 0, PAGE_SIZE).then((r) => {
        if (!fresh()) return;
        setSongs(
          rankBy(r.results, text, (s) => s.name || s.title || "", (s) => artistOf(s))
        );
        setMoreSongs(r.results.length >= PAGE_SIZE);
      }),
      searchEntities("artists", text, 12).then((r) => fresh() && setArtists(r)),
      searchEntities("albums", text, 12).then((r) => fresh() && setAlbums(r)),
      searchEntities("playlists", text, 12).then((r) => fresh() && setPlaylists(r)),
    ]);

    if (fresh()) setLoading(false);
  }, []);

  const loadMoreSongs = async () => {
    if (!submitted || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = songPage + 1;
      const r = await searchSongs(submitted, next, PAGE_SIZE);
      setSongs((prev) => {
        const seen = new Set(prev.map((s) => String(s.id)));
        return [...prev, ...r.results.filter((s) => !seen.has(String(s.id)))];
      });
      setSongPage(next);
      setMoreSongs(r.results.length >= PAGE_SIZE);
    } catch {
      setMoreSongs(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const openDetail = (type: EntityType, mini: Mini) => {
    const id = ++detailRunRef.current;
    setOpen(false);
    setDetail({ type, mini, songs: [], loading: true });
    getDetail(type, mini.id)
      .then((d) => {
        if (id === detailRunRef.current) {
          setDetail({ type, mini, songs: d.songs, loading: false });
        }
      })
      .catch(() => {
        if (id === detailRunRef.current) setDetail({ type, mini, songs: [], loading: false });
      });
  };

  const playMini = async (m: Mini) => {
    setPickingId(m.id);
    try {
      const full = await getSongById(m.id);
      if (full) player.playSong(full, [full]);
    } catch (err) {
      console.error("Could not load song:", err);
    } finally {
      setPickingId(null);
      setOpen(false);
    }
  };

  const pickItem = (it: NavItem) => {
    if (it.kind === "all") return void runSearch(query);
    if (!it.m) return;
    if (it.kind === "song") return void playMini(it.m);
    openDetail(it.kind, it.m);
  };

  const clearAll = () => {
    runRef.current++;
    setQuery("");
    setSubmitted(null);
    setDetail(null);
    setSuggest(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((a) => Math.min(a + 1, navItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = navItems[activeIdx];
      if (open && it) pickItem(it);
      else runSearch(query);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
    // keep player shortcuts (space, arrows, m, s, r...) from firing while typing:
    // PlayerContext already ignores events that come from inputs.
  };

  const playSongFrom = (song: Song, list: Song[]) => player.playSong(song, list);

  const renderSongs = (list: Song[], limit?: number) => (
    <div className="space-y-0.5">
      {(limit ? list.slice(0, limit) : list).map((song, i) => {
        const id = String(song.id);
        return (
          <SongRow
            key={`${id}-${i}`}
            song={song}
            index={i}
            playing={String(player.currentSong?.id) === id && player.isPlaying}
            isCached={cachedSongIds.has(id)}
            isCaching={cachingIds.has(id)}
            disableCache={isCachingAny}
            onPlay={() => playSongFrom(song, list)}
            onToggleCache={(e) => onToggleCache(e, song)}
          />
        );
      })}
    </div>
  );

  const grid = (items: Mini[], limit?: number) => (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {(limit ? items.slice(0, limit) : items).map((m) => (
        <EntityCard
          key={`${m.type}-${m.id}`}
          m={m}
          onOpen={() => openDetail(m.type as EntityType, m)}
        />
      ))}
    </div>
  );

  const nothingFound =
    !loading && songs.length + albums.length + artists.length + playlists.length === 0;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: 0 },
    { id: "songs", label: "Songs", count: songs.length },
    { id: "artists", label: "Artists", count: artists.length },
    { id: "albums", label: "Albums", count: albums.length },
    { id: "playlists", label: "Playlists", count: playlists.length },
  ];

  let navCounter = -1;
  const section = (label: string, list: Mini[]) =>
    list.length === 0 ? null : (
      <div key={label}>
        <p className="px-4 pb-1 pt-3 text-xs font-semibold text-muted">{label}</p>
        {list.map((m) => {
          navCounter++;
          const i = navCounter;
          return (
            <SuggestRow
              key={`${m.type}-${m.id}`}
              mini={m}
              q={query}
              selected={activeIdx === i}
              busy={pickingId === m.id}
              best={m.id === bestSongId && m.type === "song"}
              onPick={() => pickItem({ kind: m.type, m })}
            />
          );
        })}
      </div>
    );

  const showRecents = open && query.trim().length < 2 && recent.length > 0;
  const showSuggest = open && query.trim().length >= 2;

  return (
    <>
      <div ref={wrapRef} className="relative z-30 mx-auto w-full max-w-3xl">
        {/* Frosted dark search pill. On focus: it brightens a little, the icon turns
            accent and a thin accent line grows along the bottom edge. */}
        <div className="group relative overflow-hidden rounded-full bg-white/[0.06] shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-colors duration-300 focus-within:bg-white/[0.10] hover:bg-white/[0.08]">
          <Search
            size={20}
            strokeWidth={2.4}
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted transition-colors duration-300 group-focus-within:text-accent"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="home-search-list"
            aria-label="Search songs, artists, albums and playlists"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search songs, artists, albums..."
            autoComplete="off"
            className="w-full bg-transparent py-4 pl-14 pr-36 text-base font-medium text-pri caret-accent placeholder:text-muted focus:outline-none"
          />

          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {suggestLoading && <RefreshCw size={15} className="mr-1 animate-spin text-sec" />}
            {query ? (
              <button
                type="button"
                onClick={clearAll}
                aria-label="Clear search"
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-white/10 hover:text-pri"
              >
                <X size={17} />
              </button>
            ) : (
              <kbd className="mr-2 hidden h-6 min-w-6 place-items-center rounded-md bg-white/[0.08] px-1.5 text-xs font-semibold text-muted transition-opacity group-focus-within:opacity-0 sm:grid">
                /
              </kbd>
            )}
            <button
              type="button"
              onClick={() => runSearch(query)}
              disabled={!query.trim()}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-bg transition hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:bg-white/10 disabled:text-muted"
            >
              Search
            </button>
          </div>

          {/* growing accent line */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-center scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-500 ease-out group-focus-within:scale-x-100"
          />
        </div>

        {(showRecents || showSuggest) && (
          <div
            id="home-search-list"
            role="listbox"
            className="absolute left-0 right-0 top-full mt-3 max-h-[70vh] overflow-y-auto rounded-3xl bg-surface/90 pb-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            {showRecents && (
              <div>
                <div className="flex items-center justify-between px-4 pb-1 pt-3">
                  <p className="text-xs font-semibold text-muted">Recent searches</p>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearRecent}
                    className="text-xs text-muted hover:text-pri"
                  >
                    Clear
                  </button>
                </div>
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(r);
                      runSearch(r);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-pri hover:bg-white/[0.06]"
                  >
                    <Clock size={15} className="text-muted" />
                    {r}
                  </button>
                ))}
              </div>
            )}

            {showSuggest && !ranked && (
              <div className="py-2">
                <RowSkeleton n={4} />
              </div>
            )}

            {showSuggest && ranked && navItems.length <= 1 && !suggestLoading && (
              <p className="px-4 py-6 text-center text-sm text-sec">
                No quick matches. Press Enter to search everything for “{query.trim()}”.
              </p>
            )}

            {showSuggest && ranked && navItems.length > 1 && (
              <>
                {section("Songs", ranked.songs)}
                {section("Artists", ranked.artists)}
                {section("Albums", ranked.albums)}
                {section("Playlists", ranked.playlists)}
              </>
            )}

            {showSuggest && ranked && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runSearch(query)}
                className={`mt-2 flex w-full items-center gap-2 border-t border-white/[0.06] px-4 py-3 text-left text-sm font-semibold text-accent transition-colors ${
                  activeIdx === navItems.length - 1 ? "bg-white/10" : "hover:bg-white/[0.06]"
                }`}
              >
                <CornerDownLeft size={15} />
                See all results for “{query.trim()}”
              </button>
            )}
          </div>
        )}
      </div>

      {detail && (
        <section className="space-y-5">
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="flex items-center gap-2 text-sm font-semibold text-sec transition hover:text-pri"
          >
            <ArrowLeft size={16} />
            {submitted ? "Back to results" : "Close"}
          </button>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
            <CoverImage
              src={detail.mini.image}
              name={detail.mini.title}
              kind={detail.type === "artist" ? "singer" : "song"}
              className={`h-40 w-40 shrink-0 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] sm:h-48 sm:w-48 ${
                detail.type === "artist" ? "rounded-full" : "rounded-3xl"
              }`}
            />
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-sm font-medium capitalize text-sec">{detail.type}</p>
              <h2 className="text-balance text-3xl font-black tracking-tight text-pri sm:text-5xl">
                {detail.mini.title}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {detail.mini.subtitle}
                {!detail.loading && detail.songs.length > 0 && ` · ${detail.songs.length} songs`}
              </p>
              <button
                type="button"
                disabled={detail.loading || detail.songs.length === 0}
                onClick={() => playSongFrom(detail.songs[0]!, detail.songs)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-bg shadow-lg shadow-black/30 transition hover:scale-105 disabled:opacity-40"
              >
                <Play size={16} fill="currentColor" /> Play all
              </button>
            </div>
          </div>

          {detail.loading ? (
            <RowSkeleton n={6} />
          ) : detail.songs.length === 0 ? (
            <p className="py-10 text-center text-sm text-sec">No songs found here.</p>
          ) : (
            renderSongs(detail.songs)
          )}
        </section>
      )}

      {!detail && submitted && (
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goBack}
                aria-label="Back to home"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-pri transition hover:bg-white/20"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-xl font-extrabold tracking-tight text-pri sm:text-2xl">
                Results for “{submitted}”
              </h2>
            </div>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-xl transition ${
                    tab === t.id
                      ? "bg-accent text-bg"
                      : "bg-white/[0.06] text-sec hover:bg-white/[0.12] hover:text-pri"
                  }`}
                >
                  {t.label}
                  {t.id !== "all" && t.count > 0 && (
                    <span className="ml-1.5 opacity-70">{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading && songs.length === 0 && artists.length === 0 && <RowSkeleton n={6} />}

          {nothingFound && (
            <div className="rounded-3xl bg-white/[0.04] p-10 text-center backdrop-blur-xl">
              <p className="text-sm font-bold text-pri">Nothing found for “{submitted}”</p>
              <p className="mt-1 text-xs text-sec">
                Check the spelling or try fewer words, for example just the first word of the song.
              </p>
            </div>
          )}

          {tab === "all" && (
            <div className="space-y-8">
              {songs.length > 0 && (
                <div>
                  <SectionTitle
                    title="Songs"
                    onSeeAll={songs.length > 5 ? () => setTab("songs") : undefined}
                  />
                  {renderSongs(songs, 5)}
                </div>
              )}
              {artists.length > 0 && (
                <div>
                  <SectionTitle title="Artists" onSeeAll={() => setTab("artists")} />
                  {grid(artists, 6)}
                </div>
              )}
              {albums.length > 0 && (
                <div>
                  <SectionTitle title="Albums" onSeeAll={() => setTab("albums")} />
                  {grid(albums, 6)}
                </div>
              )}
              {playlists.length > 0 && (
                <div>
                  <SectionTitle title="Playlists" onSeeAll={() => setTab("playlists")} />
                  {grid(playlists, 6)}
                </div>
              )}
            </div>
          )}

          {tab === "songs" && (
            <div className="space-y-3">
              {renderSongs(songs)}
              {moreSongs && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={loadMoreSongs}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-6 py-2.5 text-xs font-semibold text-pri backdrop-blur-xl transition hover:bg-white/[0.13]"
                  >
                    {loadingMore && <RefreshCw size={13} className="animate-spin" />}
                    Show more songs
                  </button>
                </div>
              )}
            </div>
          )}
          {tab === "artists" && grid(artists)}
          {tab === "albums" && grid(albums)}
          {tab === "playlists" && grid(playlists)}
        </section>
      )}
    </>
  );
}
