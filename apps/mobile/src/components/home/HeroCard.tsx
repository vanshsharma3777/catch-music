import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, gold, radius } from "../../constants/theme";
import { usePlayer } from "../../providers/PlayerProvider";
import { getArtistName, getSongImage, getSongTitle, sameSong } from "../../lib/songHelpers";
import type { Song } from "../../types/song";
import { Cover } from "../ui/Cover";
import { Shimmer } from "../ui/Shimmer";

export function HeroCard({
  song,
  list,
  label,
  loading,
}: {
  song: Song | null;
  list: Song[];
  label: string;
  loading: boolean;
}) {
  const { currentSong, isPlaying, playSong, openFull } = usePlayer();

  if (!song) {
    return loading ? <Shimmer style={{ height: 190, marginHorizontal: 20, borderRadius: radius.xl }} /> : null;
  }

  const active = sameSong(song, currentSong);
  const image = getSongImage(song, "full");

  return (
    <Pressable
      onPress={() => (active ? openFull() : playSong(song, list))}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.92 }]}
    >
      {!!image && <Image source={{ uri: image }} blurRadius={40} style={[StyleSheet.absoluteFill, { opacity: 0.7 }]} />}
      <LinearGradient
        colors={["rgba(3,3,3,0.15)", "rgba(3,3,3,0.65)", "rgba(3,3,3,0.92)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.pill}>
        <View style={[styles.dot, active && isPlaying && { backgroundColor: colors.success }]} />
        <Text style={styles.pillText}>{active ? "NOW PLAYING" : label.toUpperCase()}</Text>
      </View>

      <View style={styles.row}>
        <Cover uri={image} style={styles.cover} iconSize={34} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.title} numberOfLines={2}>
            {getSongTitle(song)}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {getArtistName(song)}
          </Text>
        </View>
        <Pressable onPress={() => playSong(song, list)} hitSlop={8}>
          <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.play}>
            <Ionicons
              name={active && isPlaying ? "pause" : "play"}
              size={26}
              color="#000"
              style={!(active && isPlaying) ? { marginLeft: 3 } : undefined}
            />
          </LinearGradient>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20, borderRadius: radius.xl, overflow: "hidden", padding: 18, minHeight: 190,
    justifyContent: "space-between", borderWidth: 1, borderColor: colors.borderGlow, backgroundColor: colors.card,
    shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 26, shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  pill: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "rgba(0,0,0,0.45)",
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  pillText: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 14, marginTop: 28 },
  cover: { width: 88, height: 88, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  title: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  artist: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  play: {
    width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
});

export default HeroCard;