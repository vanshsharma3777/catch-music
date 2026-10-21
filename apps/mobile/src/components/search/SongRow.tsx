import { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, gold } from "../../constants/theme";
import { formatDuration } from "../../lib/discover";
import type { Mini } from "../../types/song";
import { Cover } from "./Cover";

type Props = { item: Mini; loading?: boolean; onPress: (item: Mini) => void };

function SongRowBase({ item, loading, onPress }: Props) {
  const dur = formatDuration(item.duration);
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, pressed && { transform: [{ scale: 0.985 }], backgroundColor: "rgba(255,255,255,0.08)" }]}
    >
      <Cover uri={item.image} size={54} radius={14} />
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>{item.subtitle || "Unknown artist"}</Text>
      </View>
      {dur ? <Text style={styles.dur}>{dur}</Text> : null}
      <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.play}>
        {loading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Ionicons name="play" size={15} color="#000" style={{ marginLeft: 2 }} />
        )}
      </LinearGradient>
    </Pressable>
  );
}

export const SongRow = memo(SongRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 10,
    borderRadius: 22,
    backgroundColor: colors.glass,
    borderColor: colors.border,
  },
  meta: { flex: 1, gap: 3 },
  title: { color: colors.pri, fontSize: 15, fontWeight: "700" },
  sub: { color: colors.sec, fontSize: 12.5 },
  dur: { color: colors.muted, fontSize: 12, fontVariant: ["tabular-nums"] },
  play: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});