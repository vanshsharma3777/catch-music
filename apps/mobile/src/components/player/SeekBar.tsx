import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gold } from "../../constants/theme";
import { formatTime } from "../../lib/songMeta";

type Props = { position: number; duration: number; onSeek: (sec: number) => void };

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function SeekBar({ position, duration, onSeek }: Props) {
  const [drag, setDrag] = useState<number | null>(null);
  const width = useRef(1);
  const start = useRef(0);
  const dur = useRef(duration);
  const seek = useRef(onSeek);
  dur.current = duration;
  seek.current = onSeek;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        start.current = clamp(e.nativeEvent.locationX / width.current);
        setDrag(start.current);
      },
      onPanResponderMove: (_, g) => setDrag(clamp(start.current + g.dx / width.current)),
      onPanResponderRelease: (_, g) => {
        const f = clamp(start.current + g.dx / width.current);
        setDrag(null);
        seek.current(f * dur.current);
      },
      onPanResponderTerminate: () => setDrag(null),
    })
  ).current;

  const frac = drag ?? (duration > 0 ? clamp(position / duration) : 0);
  const shown = drag !== null ? drag * duration : position;

  return (
    <View>
      <View
        style={styles.hit}
        onLayout={(e) => (width.current = e.nativeEvent.layout.width || 1)}
        {...pan.panHandlers}
      >
        <View style={styles.track} pointerEvents="none">
          <LinearGradient
            colors={gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${frac * 100}%`, height: "100%" }}
          />
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: `${frac * 100}%` }, drag !== null && styles.thumbOn]} />
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>{formatTime(shown)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 28, justifyContent: "center" },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.bgTer, overflow: "hidden" },
  thumb: {
    position: "absolute", width: 14, height: 14, borderRadius: 7, marginLeft: -7,
    backgroundColor: colors.accent,
    shadowColor: colors.primary, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  thumbOn: { transform: [{ scale: 1.35 }] },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  time: { color: colors.muted, fontSize: 12, fontVariant: ["tabular-nums"] },
});