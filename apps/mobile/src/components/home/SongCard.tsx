import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { usePlayer } from "../../providers/PlayerProvider";
import { getArtistName, getSongImage, getSongTitle, sameSong } from "../../lib/songHelpers";
import type { Song } from "../../types/song";
import { Cover } from "../ui/Cover";

export function SongCard({ song, list, size = 148 }: { song: Song; list: Song[]; size?: number }) {
  const { currentSong, isPlaying, playSong } = usePlayer();
  const active = sameSong(song, currentSong);

  return (
    <Pressable
      onPress={() => playSong(song, list)}
      style={({ pressed }) => [{ width: size }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      <View style={[styles.coverWrap, { width: size, height: size }, active && styles.coverActive]}>
        <Cover uri={getSongImage(song, "full")} style={{ width: size, height: size }} iconSize={36} />
        {active && (
          <View style={styles.badge}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={14} color="#000" />
          </View>
        )}
      </View>
      <Text style={[styles.title, active && { color: colors.accent }]} numberOfLines={1}>
        {getSongTitle(song)}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {getArtistName(song)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  coverWrap: {
    borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 8 },
  },
  coverActive: { borderColor: colors.primary },
  badge: {
    position: "absolute", right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  title: { color: colors.pri, fontSize: 14, fontWeight: "800", marginTop: 10 },
  artist: { color: colors.muted, fontSize: 12, marginTop: 2 },
});

export default SongCard;