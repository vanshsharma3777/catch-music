import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors } from "../../constants/theme";
import type { Singer } from "../../types/song";
import { CoverImage } from "../songs/CoverImage";

type Props = {
  singers: Singer[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
};

export function ArtistChips({ singers, activeId, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {singers.map((s) => {
        const on = s.id === activeId;
        return (
          <Pressable
            key={s.id}
            onPress={() => onSelect(on ? null : s.id)}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { opacity: 0.85 }]}
          >
            <CoverImage uri={s.image} label={s.name} radius={16} style={styles.avatar} />
            <Text style={[styles.name, on && { color: colors.accent }]} numberOfLines={1}>{s.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 24, gap: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, paddingLeft: 6, paddingRight: 16,
    borderRadius: 999, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.glowGold, borderColor: colors.borderGlow },
  avatar: { width: 32, height: 32 },
  name: { color: colors.pri, fontSize: 13, fontWeight: "700", maxWidth: 120 },
});