    import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors, gold, radius } from "../../constants/theme";

const BARS = [0.3, 0.5, 0.8, 0.45, 1, 0.6, 0.85, 0.4, 0.7, 0.35, 0.9, 0.5];

function Bar({ base, index }: { base: number; index: number }) {
  const v = useRef(new Animated.Value(base)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 500 + index * 40, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: base * 0.4, duration: 500 + index * 40, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, base, index]);
  return <Animated.View style={[styles.bar, { transform: [{ scaleY: v }] }]} />;
}

/** Decorative "now playing" card for the landing hero. */
export function PlayerPreview() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <LinearGradient colors={[colors.surface, colors.card]} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headLeft}>
          <View style={styles.headIcon}>
            <Feather name="music" size={14} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.now}>NOW PLAYING</Text>
            <Text style={styles.cached}>Saved offline ✓</Text>
          </View>
        </View>
        <Feather name="more-horizontal" size={20} color={colors.muted} />
      </View>

      <View style={styles.body}>
        <Animated.View style={[styles.disc, { transform: [{ rotate }] }]}>
          <LinearGradient colors={["#2a2208", colors.primary, "#2a2208"]} style={StyleSheet.absoluteFill} />
          <View style={styles.spindle} />
        </Animated.View>
        <View style={{ flex: 1, gap: 4 }}>
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
        <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: "42%", height: "100%" }} />
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>1:24</Text>
        <Text style={styles.time}>3:21</Text>
      </View>

      <View style={styles.controls}>
        <Ionicons name="shuffle" size={18} color={colors.muted} />
        <Ionicons name="play-skip-back" size={22} color={colors.sec} />
        <LinearGradient colors={gold} style={styles.play}>
          <Ionicons name="pause" size={22} color="#000" />
        </LinearGradient>
        <Ionicons name="play-skip-forward" size={22} color={colors.sec} />
        <Ionicons name="repeat" size={18} color={colors.muted} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headIcon: {
    width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  now: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  cached: { color: colors.sec, fontSize: 11, marginTop: 1 },
  body: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 20 },
  disc: {
    width: 92, height: 92, borderRadius: 46, overflow: "hidden",
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.borderGlow,
  },
  spindle: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  title: { color: colors.pri, fontSize: 20, fontWeight: "800" },
  artist: { color: colors.sec, fontSize: 13 },
  wave: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 26, marginTop: 8 },
  bar: { width: 3, height: 26, borderRadius: 2, backgroundColor: colors.accent, opacity: 0.6 },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.bgTer, overflow: "hidden", marginTop: 20 },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  time: { color: colors.muted, fontSize: 11 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingHorizontal: 6 },
  play: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
});