import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors, gold, radius } from "../../constants/theme";

const BARS = [0.3, 0.55, 0.85, 0.45, 1, 0.6, 0.9, 0.4, 0.75, 0.35, 0.95, 0.5, 0.7, 0.4];
const TRACK_SECONDS = 201;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Bar({ base, index }: { base: number; index: number }) {
  const v = useRef(new Animated.Value(base)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 420 + index * 45, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: base * 0.3, duration: 420 + index * 45, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, base, index]);
  return <Animated.View style={[styles.bar, { transform: [{ scaleY: v }] }]} />;
}

export function PlayerPreview() {
  const spin = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [elapsed, setElapsed] = useState(84);

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    spinLoop.start();
    floatLoop.start();
    return () => {
      spinLoop.stop();
      floatLoop.stop();
    };
  }, [spin, float]);

  useEffect(() => {
    const id = setInterval(() => setElapsed((t) => (t + 1) % TRACK_SECONDS), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: elapsed / TRACK_SECONDS,
      duration: elapsed === 0 ? 0 : 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [elapsed, progress]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const lift = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Animated.View style={{ transform: [{ translateY: lift }] }}>
      <View pointerEvents="none" style={styles.halo} />

      <LinearGradient colors={[colors.surface, colors.card]} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headLeft}>
            <View style={styles.headIcon}>
              <Feather name="music" size={14} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.now}>NOW PLAYING</Text>
              <View style={styles.savedRow}>
                <Feather name="check-circle" size={11} color={colors.success} />
                <Text style={styles.saved}>Saved offline</Text>
              </View>
            </View>
          </View>
          <Feather name="more-horizontal" size={20} color={colors.muted} />
        </View>

        <View style={styles.body}>
          <Animated.View style={[styles.disc, { transform: [{ rotate }] }]}>
            <LinearGradient colors={["#2a2208", colors.primary, "#2a2208"]} style={StyleSheet.absoluteFill} />
            <View style={styles.discRing} />
            <View style={styles.spindle} />
          </Animated.View>

          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.title} numberOfLines={1}>Aari Aari</Text>
            <Text style={styles.artist} numberOfLines={1}>Dhurandhar 2</Text>
            <View style={styles.wave}>
              {BARS.map((b, i) => (
                <Bar key={i} base={b} index={i} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.track}>
          <Animated.View style={{ width, height: "100%" }}>
            <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
        <View style={styles.times}>
          <Text style={styles.time}>{fmt(elapsed)}</Text>
          <Text style={styles.time}>{fmt(TRACK_SECONDS)}</Text>
        </View>

        <View style={styles.controls}>
          <Ionicons name="shuffle" size={18} color={colors.accent} />
          <Ionicons name="play-skip-back" size={22} color={colors.sec} />
          <LinearGradient colors={gold} style={styles.play}>
            <Ionicons name="pause" size={24} color="#000" />
          </LinearGradient>
          <Ionicons name="play-skip-forward" size={22} color={colors.sec} />
          <Ionicons name="repeat" size={18} color={colors.muted} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: "absolute",
    top: 30,
    left: 20,
    right: 20,
    bottom: -10,
    borderRadius: 40,
    backgroundColor: "rgba(212,175,55,0.18)",
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 20 },
    elevation: 14,
  },
  card: {
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headIcon: {
    width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  now: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  saved: { color: colors.sec, fontSize: 11 },
  body: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 22 },
  disc: {
    width: 96, height: 96, borderRadius: 48, overflow: "hidden",
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.borderGlow,
  },
  discRing: {
    position: "absolute", width: 64, height: 64, borderRadius: 32,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.3)",
  },
  spindle: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  title: { color: colors.pri, fontSize: 21, fontWeight: "800", letterSpacing: -0.4 },
  artist: { color: colors.sec, fontSize: 13 },
  wave: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 28, marginTop: 8 },
  bar: { width: 3, height: 28, borderRadius: 2, backgroundColor: colors.accent, opacity: 0.75 },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.bgTer, overflow: "hidden", marginTop: 22 },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  time: { color: colors.muted, fontSize: 11, fontVariant: ["tabular-nums"] },
  controls: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 14, paddingHorizontal: 6,
  },
  play: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
});