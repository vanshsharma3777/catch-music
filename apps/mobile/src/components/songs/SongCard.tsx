import { memo, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gold } from "../../constants/theme";
import type { Song } from "../../types/song";
import { getArtistName, getSongImage, getSongTitle } from "../../lib/songMeta";
import { CoverImage } from "./CoverImage";
import { Equalizer } from "./Equalizer";
import { LikeButton } from "./LikeButton";

type Props = {
  song: Song;
  width: number;
  active: boolean;
  playing: boolean;
  onPress: () => void;
};

function SongCardBase({ song, width, active, playing, onPress }: Props) {
  const showPause = active && playing;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ width }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
      <View style={[styles.card, active && styles.cardActive]}>
        <View style={{ width: "100%", aspectRatio: 1 }}>
          <CoverImage uri={getSongImage(song, "thumb")} radius={16} style={StyleSheet.absoluteFill} />

          <LikeButton song={song} size={16} style={styles.like} />

          {active && (
            <View style={styles.eq}>
              <Equalizer playing={playing} height={12} />
            </View>
          )}

          <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
            <Ionicons name={showPause ? "pause" : "play"} size={15} color="#000" style={!showPause && { marginLeft: 2 }} />
          </LinearGradient>
        </View>

        <Text style={[styles.title, active && { color: colors.accent }]} numberOfLines={1}>
          {getSongTitle(song)}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{getArtistName(song)}</Text>
      </View>
    </Pressable>
  );
}

export const SongCard = memo(SongCardBase);

export function SongCardSkeleton({ width }: { width: number }) {
  const v = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);

  return (
    <Animated.View style={[styles.card, { width, opacity: v }]}>
      <View style={[styles.skelArt, { width: "100%" }]} />
      <View style={[styles.skelLine, { width: "75%", marginTop: 12 }]} />
      <View style={[styles.skelLine, { width: "45%", marginTop: 6 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 8, borderRadius: 22, backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.border,
  },
  cardActive: { borderColor: colors.borderGlow, backgroundColor: colors.glowGold },
  like: {
    position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  eq: {
    position: "absolute", left: 8, bottom: 8, paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 10, backgroundColor: "rgba(0,0,0,0.6)",
  },
  fab: {
    position: "absolute", right: 8, bottom: 8, width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  title: { color: colors.pri, fontSize: 13.5, fontWeight: "700", marginTop: 10, paddingHorizontal: 2 },
  artist: { color: colors.muted, fontSize: 12, marginTop: 2, paddingHorizontal: 2 },
  skelArt: { aspectRatio: 1, borderRadius: 16, backgroundColor: colors.bgTer },
  skelLine: { height: 10, borderRadius: 5, backgroundColor: colors.bgTer },
});