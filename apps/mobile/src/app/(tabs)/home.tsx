import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../constants/theme";
import { discoverFeed, useDiscoverFeed } from "../../lib/discoverFeed";
import { suggestedFeed, useSuggestedFeed } from "../../lib/suggestedFeed";
import { useRecentSongs } from "../../lib/recentSongs";
import { useFavoriteSingers } from "../../hooks/useFavoriteSingers";
import { useProfile } from "../../hooks/useProfile";
import { usePlayer } from "../../providers/PlayerProvider";
import { AppHeader } from "../../components/nav/AppHeader";
import { HeroCard } from "../../components/home/HeroCard";
import { SongRail } from "../../components/home/SongRail";
import { ArtistRail } from "../../components/home/ArtistRail";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

export default function HomeScreen() {
  const router = useRouter();
  const profile = useProfile();
  const { currentSong } = usePlayer();
  const recent = useRecentSongs();
  const discover = useDiscoverFeed();
  const suggested = useSuggestedFeed();
  const { singers } = useFavoriteSingers();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    discoverFeed.init();
  }, []);

  useEffect(() => {
    suggestedFeed.init(singers);
  }, [singers]);

  useEffect(() => {
    discoverFeed.ensureBuffer(20);
  }, [discover.songs.length, discover.loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    discoverFeed.refresh();
    suggestedFeed.refresh(singers);
    setTimeout(() => setRefreshing(false), 900);
  }, [singers]);

  const heroSong = currentSong ?? recent[0] ?? discover.songs[0] ?? null;
  const heroList = currentSong ? [currentSong] : recent[0] ? recent : discover.songs;
  const heroLabel = recent[0] ? "Jump back in" : "Start here";
  const firstName = (profile?.name || "Music Lover").split(" ")[0];

  return (
    <View style={styles.root}>
      <AppHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 22, paddingBottom: 36, gap: 34 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
      >
        <View style={{ paddingHorizontal: 20, gap: 4 }}>
          <Text style={styles.hello}>{greeting()}</Text>
          <Text style={styles.h1}>
            <Text style={{ color: colors.accent }}>{firstName}</Text>, what are we{"\n"}listening to?
          </Text>
        </View>

        <HeroCard song={heroSong} list={heroList} label={heroLabel} loading={discover.loading} />

        <SongRail
          icon="time-outline"
          title="Recently played"
          songs={recent}
          loading={false}
          limit={10}
          empty="Nothing played yet. Pick any song and it will show up here."
          onSeeAll={() => router.push("/recent" as never)}
        />
          <SongRail
            icon="sparkles"
            title="Suggested for you"
            subtitle={singers.length ? `Based on ${singers.map((s) => s.name).join(", ")}` : undefined}
            songs={suggested.songs}
            loading={suggested.loading}
            onSeeAll={() => router.push("/suggested" as never)}
          />
        <SongRail
          icon="shuffle"
          title="Discover"
          subtitle="Fresh picks from different artists"
          songs={discover.songs}
          loading={discover.loading}
          onSeeAll={() => router.push("/discover" as never)}
        />

        

        <ArtistRail singers={singers} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hello: { color: colors.sec, fontSize: 14, fontWeight: "600" },
  h1: { color: colors.pri, fontSize: 32, fontWeight: "900", letterSpacing: -1, lineHeight: 38 },
});