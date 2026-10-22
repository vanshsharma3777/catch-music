import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { AmbientBackground } from "../../components/ui/AmbientBackground";
import { SearchBar } from "../../components/search/SearchBar";
import { SearchTabs } from "../../components/search/SearchTabs";
import { SongRow } from "../../components/search/SongRow";
import { EntityCard } from "../../components/search/EntityCard";
import { EmptyState, ErrorState, IdleState, SearchSkeleton, SectionTitle } from "../../components/search/SearchStates";
import { useSearch } from "../../hooks/useSearch";
import { useRecentSearches } from "../../lib/recentSearches";
import { getSongById, songToMini } from "../../lib/discover";
import { playSong } from "../../lib/playerBridge";
import type { Mini, SearchTab } from "../../types/song";

const H_PAD = 24;
const GAP = 14;

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const [resolving, setResolving] = useState<string | null>(null);

  const s = useSearch(query, tab);
  const { recents, add, remove, clear } = useRecentSearches();

  const commit = useCallback(() => {
    add(query);
    Keyboard.dismiss();
    console.log("hit pickq")
  }, [add, query]);

  const pick = useCallback((q: string) => {
    setQuery(q);
    add(q);
    Keyboard.dismiss();
    console.log("hit pickq")
  }, [add]);

  // Play a full Song we already have (Songs tab)
  const playFull = useCallback(
    (item: Mini) => {
      const song = s.songs.find((x) => String(x.id) === item.id);
      if (!song) return;
      add(query);
      playSong(song, s.songs);
    },
    [s.songs, add, query]
  );


useEffect(() => {
  console.log("SearchScreen MOUNTED");

  return () => {
    console.log("SearchScreen UNMOUNTED");
  };
}, []);
  // Play a light suggestion: fetch the playable song first
  const playSuggested = useCallback(
    async (item: Mini) => {
      if (resolving) return;
      setResolving(item.id);
      try {
        const song = await getSongById(item.id);
        if (song) {
          add(query);
          playSong(song, [song]);
        }
      } catch {
        /* silent: row stops spinning */
      } finally {
        setResolving(null);
      }
    },
    [resolving, add, query]
  );

  const openEntity = useCallback(
    (item: Mini) => {
      add(query);
      router.push({ pathname: "/collection", params: { type: item.type, id: item.id, name: item.title } } as never);
    },
    [router, add, query]
  );

  const songRows = useMemo(() => s.songs.map(songToMini), [s.songs]);

  const colsFor = (t: SearchTab) => (t === "artists" ? 3 : 2);
  const cardW = (cols: number) => Math.floor((width - H_PAD * 2 - GAP * (cols - 1)) / cols);

  // ---------- body ----------
  const hasAny =
    tab === "all"
      ? !!s.suggest &&
        s.suggest.songs.length + s.suggest.artists.length + s.suggest.albums.length + s.suggest.playlists.length > 0
      : tab === "songs"
      ? s.songs.length > 0
      : s.entities.length > 0;

  const renderBody = () => {
    if (!s.active) {
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pad}
        >
          <IdleState recents={recents} onPick={pick} onRemove={remove} onClear={clear} />
        </ScrollView>
      );
    }
    if (s.error && !hasAny) return <ErrorState message={s.error} onRetry={s.retry} />;
    if ((s.loading || s.pending) && !hasAny) {
      return (
        <View style={styles.pad}>
          <SearchSkeleton />
        </View>
      );
    }
    if (!hasAny) return <EmptyState query={query.trim()} />;

    if (tab === "all" && s.suggest) {
      const { songs, artists, albums, playlists } = s.suggest;
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.pad, { gap: 30 }]}
        >
          {songs.length > 0 && (
            <View>
              <SectionTitle title="Songs" action="See all" onAction={() => setTab("songs")} />
              <View style={{ gap: 10 }}>
                {songs.slice(0, 6).map((it) => (
                  <SongRow key={it.id} item={it} loading={resolving === it.id} onPress={playSuggested} />
                ))}
              </View>
            </View>
          )}
          {artists.length > 0 && <Rail title="Artists" items={artists} size={112} onSeeAll={() => setTab("artists")} onPress={openEntity} />}
          {albums.length > 0 && <Rail title="Albums" items={albums} size={146} onSeeAll={() => setTab("albums")} onPress={openEntity} />}
          {playlists.length > 0 && <Rail title="Playlists" items={playlists} size={146} onSeeAll={() => setTab("playlists")} onPress={openEntity} />}
        </ScrollView>
      );
    }

    if (tab === "songs") {
      return (
        <FlatList
          data={songRows}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => <SongRow item={item} onPress={playFull} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={styles.pad}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onEndReached={s.loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={s.loadingMore ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} /> : <View style={{ height: 20 }} />}
        />
      );
    }

    const cols = colsFor(tab);
    const w = cardW(cols);
    return (
      <FlatList
        key={tab}
        data={s.entities}
        numColumns={cols}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <EntityCard item={item} width={w} onPress={openEntity} />}
        columnWrapperStyle={{ gap: GAP, marginBottom: 22 }}
        contentContainerStyle={styles.pad}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.root}>
      <AmbientBackground />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <Feather name="arrow-left" size={18} color={colors.pri} />
          </Pressable>
          <View>
            <Text style={styles.title}>
              Search <Text style={{ color: colors.accent }}>Music</Text>
            </Text>
          </View>
        </View>

        <SearchBar value={query} onChangeText={setQuery} onSubmit={commit} busy={s.loading || s.pending}  />
      </View>

      <View style={styles.tabsWrap}>
        <SearchTabs value={tab} onChange={setTab} />
      </View>

      <View style={{ flex: 1, paddingBottom: insets.bottom }}>{renderBody()}</View>
    </View>
  );
}

function Rail({
  title,
  items,
  size,
  onSeeAll,
  onPress,
}: {
  title: string;
  items: Mini[];
  size: number;
  onSeeAll: () => void;
  onPress: (m: Mini) => void;
}) {
  return (
    <View>
      <SectionTitle title={title} action="See all" onAction={onSeeAll} />
      <FlatList
        horizontal
        data={items}
        keyExtractor={(it) => it.id}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
        renderItem={({ item }) => <EntityCard item={item} width={size} onPress={onPress} />}
        style={{ marginHorizontal: -H_PAD }}
        contentContainerStyle={{ paddingHorizontal: H_PAD }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: H_PAD, gap: 18 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: { color: colors.pri, fontSize: 28, fontWeight: "900", letterSpacing: -0.9 },
  tabsWrap: { paddingVertical: 16 },
  pad: { paddingHorizontal: H_PAD, paddingBottom: 140 },
});