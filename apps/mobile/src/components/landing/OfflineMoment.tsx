import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors, gold } from "../../constants/theme";
import { SectionHeading } from "../ui/SectionHeading";
import { GlowCard } from "../ui/GlowCard";
import { DEMO_SONGS } from "./landingData";

function Ring({ delay }: { delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 2800, delay, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  return (
    <Animated.View
      style={[
        styles.ring,
        {
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2] }) }],
        },
      ]}
    />
  );
}

export function OfflineMoment() {
  const [online, setOnline] = useState(true);
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setOnline((o) => !o), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    pop.setValue(0.55);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [online, pop]);

  return (
    <View style={{ gap: 24 }}>
      <SectionHeading
        tag="The magic"
        title="No signal."
        highlight="Still vibing."
        subtitle="Your saved songs live on your device, so tunnels and flights can't touch your playlist."
      />

      <GlowCard strong corner={28} innerStyle={{ padding: 22, gap: 22 }}>
        <View style={styles.stage}>
          {!online && (
            <>
              <Ring delay={0} />
              <Ring delay={1400} />
            </>
          )}
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <LinearGradient
              colors={online ? [colors.bgTer, colors.surface] : gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.orb, online && styles.orbOnline]}
            >
              <Feather name={online ? "wifi" : "wifi-off"} size={38} color={online ? colors.accent : "#000"} />
            </LinearGradient>
          </Animated.View>
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={styles.status}>{online ? "ONLINE" : "OFFLINE"}</Text>
          <Text style={styles.statusSub}>
            {online ? "Streaming from the catalog" : "Playing from your device"}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {DEMO_SONGS.map((s, i) => (
            <View key={s.title} style={styles.row}>
              <LinearGradient
                colors={i === 0 ? gold : [colors.bgTer, colors.surface]}
                style={styles.art}
              >
                <Feather name="music" size={16} color={i === 0 ? "#000" : colors.muted} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.song} numberOfLines={1}>{s.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{s.artist}</Text>
              </View>
              <Feather name="check-circle" size={18} color={colors.success} />
            </View>
          ))}
        </View>
      </GlowCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 150, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute", width: 90, height: 90, borderRadius: 45,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  orb: {
    width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 26, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  orbOnline: { borderWidth: 1, borderColor: colors.borderGlow, shadowOpacity: 0.15 },
  status: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 3 },
  statusSub: { color: colors.sec, fontSize: 14 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 16,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border,
  },
  art: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  song: { color: colors.pri, fontSize: 14, fontWeight: "700" },
  artist: { color: colors.muted, fontSize: 12, marginTop: 1 },
});