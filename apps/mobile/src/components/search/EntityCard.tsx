import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Mini } from "../../types/song";
import { colors } from "../../constants/theme";
import { Cover } from "./Cover";

type Props = { item: Mini; width: number; onPress: (item: Mini) => void };

function EntityCardBase({ item, width, onPress }: Props) {
  const round = item.type === "artist";
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [{ width }, pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }]}
    >
      <View style={round ? styles.centered : undefined}>
        <Cover uri={item.image} size={width} round={round} radius={22} style={styles.shadow} />
      </View>
      <Text style={[styles.title, round && styles.centerText]} numberOfLines={1}>{item.title}</Text>
      <Text style={[styles.sub, round && styles.centerText]} numberOfLines={1}>{item.subtitle}</Text>
    </Pressable>
  );
}

export const EntityCard = memo(EntityCardBase);

const styles = StyleSheet.create({
  centered: { alignItems: "center" },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: { color: colors.pri, fontSize: 14, fontWeight: "700", marginTop: 10 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  centerText: { textAlign: "center" },
});