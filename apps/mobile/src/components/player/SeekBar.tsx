import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gold } from "../../constants/theme";
import { formatDuration } from "../../lib/discover";

type Props = { position: number; duration: number; onSeek: (s: number) => void };

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const fmt = (s: number) => formatDuration(s) || "0:00";

export function SeekBar({ position, duration, onSeek }: Props) {
  const [drag, setDrag] = useState<number | null>(null);
  const width = useRef(1);
  const startX = useRef(0);
  const last = useRef(0);
  const dur = useRef(duration);
  const cb = useRef(onSeek);
  dur.current = duration;
  cb.current = onSeek;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        startX.current = e.nativeEvent.locationX;
        last.current = clamp(startX.current / width.current);
        setDrag(last.current);
      },
      onPanResponderMove: (_, g) => {
        last.current = clamp((startX.current + g.dx) / width.current);
        setDrag(last.current);
      },
      onPanResponderRelease: () => {
        if (dur.current > 0) cb.current(last.current * dur.current);
        setDrag(null);
      },
      onPanResponderTerminate: () => setDrag(null),
    })
  ).current;

  const frac = drag ?? (duration > 0 ? clamp(position / duration) : 0);
  const shown = drag !== null ? drag * duration : position;

  return (
    <View>
      <View style={styles.hit} onLayout={(e) => (width.current = e.nativeEvent.layout.width || 1)} {...pan.panHandlers}>
        <View pointerEvents="none" style={styles.track}>
          <LinearGradient
            colors={gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${frac * 100}%`, height: "100%" }}
          />
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: `${frac * 100}%` }, drag !== null && styles.thumbActive]} />
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>{fmt(shown)}</Text>
        <Text style={styles.time}>{fmt(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 28, justifyContent: "center" },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.bgTer, overflow: "hidden" },
  thumb: {
    position: "absolute",
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: colors.accent,
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  thumbActive: { transform: [{ scale: 1.35 }] },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  time: { color: colors.muted, fontSize: 12, fontVariant: ["tabular-nums"] },
});