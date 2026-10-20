import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../constants/theme";

/** Endless horizontal ticker. Items are duplicated so the loop is seamless. */
export function Marquee({ items, speed = 38 }: { items: string[]; speed?: number }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);

  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -w,
        duration: (w / speed) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [w, speed, x]);

  const row = items.map((t) => (
    <View key={t} style={styles.item}>
      <Text style={styles.diamond}>◆</Text>
      <Text style={styles.text}>{t}</Text>
    </View>
  ));

  return (
    <View style={styles.band}>
      <Animated.View style={[styles.track, { transform: [{ translateX: x }] }]}>
        <View style={styles.row} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {row}
        </View>
        <View style={styles.row}>{row}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    overflow: "hidden",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: "rgba(212,175,55,0.04)",
  },
  track: { flexDirection: "row", alignSelf: "flex-start" },
  row: { flexDirection: "row", flexShrink: 0 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, marginRight: 28, flexShrink: 0 },
  diamond: { color: colors.primary, fontSize: 10 },
  text: {
    color: colors.sec,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    borderRadius: radius.sm,
  },
});