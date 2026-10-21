import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "./useDebounce";
import { fetchSuggest, peekSuggest, searchEntities, searchSongs } from "../lib/discover";
import type { Mini, SearchTab, Song, SuggestResult } from "../types/song";

const PAGE = 24;
export const MIN_CHARS = 2;

type State = {
  suggest: SuggestResult | null;
  songs: Song[];
  entities: Mini[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
};

const INITIAL: State = {
  suggest: null,
  songs: [],
  entities: [],
  hasMore: false,
  loading: false,
  loadingMore: false,
  error: null,
};

export function useSearch(query: string, tab: SearchTab) {
  const q = useDebounce(query.trim(), 350);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State>(INITIAL);

  const reqId = useRef(0);
  const lastTab = useRef<SearchTab>(tab);
  const page = useRef(0);
  const seen = useRef(new Set<string>());
  const moreLock = useRef(false);

  // true while the user is still typing (before the debounce fires)
  const pending = query.trim() !== q && query.trim().length >= MIN_CHARS;

  useEffect(() => {
    const id = ++reqId.current;
    moreLock.current = false;

    if (q.length < MIN_CHARS) {
      lastTab.current = tab;
      setState(INITIAL);
      return;
    }

    if (tab === "all") {
      const hit = peekSuggest(q);
      if (hit) {
        lastTab.current = tab;
        setState({ ...INITIAL, suggest: hit });
        return;
      }
    }

    const ctrl = new AbortController();
    const keepOld = lastTab.current === tab;
    lastTab.current = tab;
    setState((s) => ({ ...(keepOld ? s : INITIAL), loading: true, error: null }));

    (async () => {
      try {
        if (tab === "all") {
          const suggest = await fetchSuggest(q, ctrl.signal);
          if (id !== reqId.current) return;
          setState({ ...INITIAL, suggest });
        } else if (tab === "songs") {
          const { results } = await searchSongs(q, 0, PAGE, ctrl.signal);
          if (id !== reqId.current) return;
          page.current = 0;
          seen.current = new Set(results.map((s) => String(s.id)));
          setState({ ...INITIAL, songs: results, hasMore: results.length >= PAGE });
        } else {
          const entities = await searchEntities(tab, q, PAGE, ctrl.signal);
          if (id !== reqId.current) return;
          setState({ ...INITIAL, entities });
        }
      } catch (e: any) {
        if (ctrl.signal.aborted || id !== reqId.current) return;
        setState((s) => ({ ...s, loading: false, error: e?.message || "Search failed. Try again." }));
      }
    })();

    return () => ctrl.abort();
  }, [q, tab, nonce]);

  const loadMore = useCallback(async () => {
    if (tab !== "songs" || !state.hasMore || state.loading || moreLock.current) return;
    moreLock.current = true;
    const id = reqId.current;
    setState((s) => ({ ...s, loadingMore: true }));
    try {
      const { results } = await searchSongs(q, page.current + 1, PAGE);
      if (id !== reqId.current) return;
      page.current += 1;
      const fresh = results.filter((s) => !seen.current.has(String(s.id)));
      fresh.forEach((s) => seen.current.add(String(s.id)));
      setState((s) => ({
        ...s,
        songs: [...s.songs, ...fresh],
        hasMore: fresh.length > 0 && results.length >= PAGE,
        loadingMore: false,
      }));
    } catch {
      setState((s) => ({ ...s, loadingMore: false }));
    } finally {
      moreLock.current = false;
    }
  }, [q, tab, state.hasMore, state.loading]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, active: q.length >= MIN_CHARS, pending, loadMore, retry };
}