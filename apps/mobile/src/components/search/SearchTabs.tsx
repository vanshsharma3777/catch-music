import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gold, radius } from "../../constants/theme";
import type { SearchTab } from "../../types/song";

export const TABS: { id: SearchTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "songs", label: "Songs" },
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" },
  { id: "playlists", label: "Playlists" },
];

export function SearchTabs({ value, onChange }: { value: SearchTab; onChange: (t: SearchTab) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
    >
      {TABS.map((t) => {
        const active = t.id === value;
        return (
          <Pressable key={t.id} onPress={() => onChange(t.id)} style={({ pressed }) => pressed && { opacity: 0.85 }}>
            {active ? (
              <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
                <Text style={[styles.label, { color: "#000" }]}>{t.label}</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.chip, styles.ghost, styles.label, { color: colors.sec }]}>{t.label}</Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 24, gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.pill, overflow: "hidden" },
  ghost: { backgroundColor: colors.glass, borderColor: colors.borderLight },
  label: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
});