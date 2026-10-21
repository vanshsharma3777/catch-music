import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, gold, radius } from "../../constants/theme";
import { usePlayer } from "../../providers/PlayerProvider";
import { getArtistName, getSongImage, getSongTitle } from "../../lib/songHelpers";
import { Cover } from "../ui/Cover";
import { VolumePopup } from "../ui/VolumePopup";
import { SongMenu } from "../ui/SongMenu";

export function volumeIcon(volume: number, muted: boolean) {
  if (muted || volume === 0) return "volume-mute" as const;
  if (volume < 0.4) return "volume-low" as const;
  return "volume-high" as const;
}

export function MiniPlayer() {
  const {
    currentSong, isPlaying, isBuffering, currentTime, duration,
    volume, isMuted, togglePlay, nextSong, previousSong, openFull, setVolume, toggleMute,
  } = usePlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <View style={styles.outer}>
      <LinearGradient colors={[colors.surface, colors.card]} style={styles.card}>
        <View style={styles.row}>
          {/* cover + title */}
          <Pressable onPress={openFull} style={styles.info}>
            <Cover
              uri={getSongImage(currentSong, "thumb")}
              style={styles.cover}
              iconSize={18}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>{getSongTitle(currentSong)}</Text>
              <Text style={styles.artist} numberOfLines={1}>{getArtistName(currentSong)}</Text>
            </View>
          </Pressable>

          {/* three-dot menu (previous ke left me) */}
          <SongMenu song={currentSong} />

          <Pressable onPress={previousSong} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name="play-skip-back" size={22} color={colors.pri} />
          </Pressable>

          <Pressable onPress={togglePlay} style={({ pressed }) => pressed && { opacity: 0.85 }}>
            <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.play}>
              <Ionicons
                name={isBuffering && !isPlaying ? "hourglass" : isPlaying ? "pause" : "play"}
                size={20}
                color="#000"
                style={!isPlaying && !isBuffering ? { marginLeft: 2 } : undefined}
              />
            </LinearGradient>
          </Pressable>

          <Pressable onPress={nextSong} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name="play-skip-forward" size={22} color={colors.pri} />
          </Pressable>

          {/* volume (next ke right me) */}
          <VolumePopup
            volume={volume}
            isMuted={isMuted}
            onChange={setVolume}
            onToggleMute={toggleMute}
          />
        </View>

        <View style={styles.progressTrack}>
          <LinearGradient
            colors={gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${progress * 100}%`, height: "100%" }}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: 10, paddingBottom: 8 },
  card: {
    borderRadius: radius.md + 2,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 2, padding: 8, paddingRight: 6 },
  info: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10, marginRight: 4 },
  cover: { width: 44, height: 44, borderRadius: 10 },
  title: { color: colors.pri, fontSize: 14, fontWeight: "800" },
  artist: { color: colors.sec, fontSize: 12, marginTop: 1 },
  iconBtn: { width: 32, height: 34, alignItems: "center", justifyContent: "center" },
  play: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginHorizontal: 2 },
  progressTrack: { height: 2.5, backgroundColor: "rgba(255,255,255,0.08)" },
});

export default MiniPlayer;