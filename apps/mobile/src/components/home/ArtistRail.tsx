import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../constants/theme";
import type { Singer } from "../../constants/singers";
import { Cover } from "../ui/Cover";
import { SectionHeader } from "./SectionHeader";

export function ArtistRail({ singers }: { singers: Singer[] }) {
  const router = useRouter();
  if (singers.length === 0) return null;

  return (
    <View style={{ gap: 14 }}>
      <SectionHeader icon="mic-outline" title="Your artists" subtitle="Tap to hear only their songs" />
      <FlatList
        data={singers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 18 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/artist/[id]", params: { id: item.id } } as never)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <View style={styles.ring}>
              <Cover uri={item.image} style={styles.avatar} iconSize={30} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.genre} numberOfLines={1}>
              {item.genre}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { width: 104, alignItems: "center", gap: 4 },
  ring: {
    width: 104, height: 104, borderRadius: 52, padding: 2, borderWidth: 1.5, borderColor: colors.primary,
    shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  avatar: { flex: 1, borderRadius: 50 },
  name: { color: colors.pri, fontSize: 13, fontWeight: "800", marginTop: 8 },
  genre: { color: colors.muted, fontSize: 11 },
});

export default ArtistRail;