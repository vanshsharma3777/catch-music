import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, gold } from "../../constants/theme";
import type { Song } from "../../types/song";
import { getArtistName, getSongImage, getSongTitle } from "../../lib/songMeta";
import { CoverImage } from "../songs/CoverImage";

type Props = { song: Song; label: string; playing: boolean; onPress: () => void };

export function HeroNowCard({ song, label, playing, onPress }: Props) {
  const uri = getSongImage(song, "thumb");
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
      {!!uri && <Image source={{ uri }} blurRadius={30} style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.3 }] }]} />}
      <LinearGradient colors={["rgba(3,3,3,0.15)", "rgba(3,3,3,0.88)"]} style={StyleSheet.absoluteFill} />

      <View style={styles.pill}>
        <View style={styles.dot} />
        <Text style={styles.pillText}>{label}</Text>
      </View>

      <View style={styles.bottom}>
        <CoverImage uri={getSongImage(song, "full")} radius={20} style={styles.art} />
        <View style={{ flex: 1, paddingBottom: 4 }}>
          <Text style={styles.title} numberOfLines={2}>{getSongTitle(song)}</Text>
          <Text style={styles.artist} numberOfLines={1}>{getArtistName(song)}</Text>
        </View>
        <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.play}>
          <Ionicons name={playing ? "pause" : "play"} size={24} color="#000" style={!playing && { marginLeft: 3 }} />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 230, borderRadius: 30, overflow: "hidden", padding: 18, justifyContent: "space-between",
    borderWidth: 1, borderColor: colors.borderGlow, backgroundColor: colors.card,
    shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 10,
  },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  pillText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  bottom: { flexDirection: "row", alignItems: "flex-end", gap: 14 },
  art: { width: 92, height: 92 },
  title: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.5, lineHeight: 24 },
  artist: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 3 },
  play: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
});