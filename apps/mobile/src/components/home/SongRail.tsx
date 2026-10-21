import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import type { Song } from "../../types/song";
import { Shimmer } from "../ui/Shimmer";
import { SectionHeader } from "./SectionHeader";
import { SongCard } from "./SongCard";

type IconName = keyof typeof Ionicons.glyphMap;

const CARD = 148;

export function SongRail({
  icon,
  title,
  subtitle,
  songs,
  loading,
  limit = 20,
  onSeeAll,
  empty,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  songs: Song[];
  loading: boolean;
  limit?: number;
  onSeeAll?: () => void;
  empty?: string;
}) {
  const shown = songs.slice(0, limit);
  const showSkeleton = loading && songs.length === 0;

  return (
    <View style={{ gap: 14 }}>
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        onSeeAll={songs.length > 0 ? onSeeAll : undefined}
      />

      {showSkeleton ? (
        <View style={styles.skelRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: CARD, gap: 10 }}>
              <Shimmer style={{ width: CARD, height: CARD, borderRadius: 18 }} />
              <Shimmer style={{ width: CARD * 0.8, height: 12 }} />
              <Shimmer style={{ width: CARD * 0.5, height: 10 }} />
            </View>
          ))}
        </View>
      ) : shown.length === 0 ? (
        <Text style={styles.empty}>{empty ?? "Nothing here yet."}</Text>
      ) : (
        <FlatList
          data={shown}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
          renderItem={({ item }) => <SongCard song={item} list={songs} size={CARD} />}
          ListFooterComponent={
            onSeeAll ? (
              <Pressable onPress={onSeeAll} style={[styles.seeTile, { width: CARD, height: CARD }]}>
                <View style={styles.seeCircle}>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </View>
                <Text style={styles.seeText}>See all</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  skelRow: { flexDirection: "row", gap: 14, paddingHorizontal: 20 },
  empty: { color: colors.muted, fontSize: 13, paddingHorizontal: 20 },
  seeTile: {
    borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  seeCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  seeText: { color: colors.accent, fontWeight: "800", fontSize: 13 },
});

export default SongRail;