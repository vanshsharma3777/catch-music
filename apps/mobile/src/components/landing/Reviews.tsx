import { FlatList, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors, radius } from "../../constants/theme";
import { useReviews } from "../../hooks/useReviews";
import type { Review } from "../../types/review";
import { SectionHeading } from "../ui/SectionHeading";

const CARD_W = 290;

function Stars({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Feather key={n} name="star" size={14} color={n <= value ? colors.primary : colors.muted} />
      ))}
    </View>
  );
}

function ReviewCard({ item }: { item: Review }) {
  return (
    <LinearGradient colors={[colors.surface, colors.card]} style={styles.card}>
      <View style={styles.top}>
        {item.rating ? <Stars value={item.rating} /> : <View />}
        <Feather name="message-circle" size={18} color={colors.borderGlow} />
      </View>
      <Text style={styles.msg} numberOfLines={5}>{item.message}</Text>
      <View style={styles.footer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.trim().charAt(0).toUpperCase() || "?"}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      </View>
    </LinearGradient>
  );
}

/** Live reviews from /api/feedback. Hidden if there are none (same as web). */
export function Reviews() {
  const { reviews } = useReviews(10);
  if (reviews.length === 0) return null;

  return (
    <View style={{ gap: 20 }}>
      <View style={{ paddingHorizontal: 24 }}>
        <SectionHeading tag="Reviews" title="Loved by Listeners." highlight="Hanging on Every Word." />
      </View>
      <FlatList
        data={reviews}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(r) => String(r.id)}
        snapToInterval={CARD_W + 14}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
        renderItem={({ item }) => <ReviewCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W, height: 230, borderRadius: radius.lg, padding: 20,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  msg: { color: colors.sec, fontSize: 14, lineHeight: 21, marginTop: 14 },
  footer: {
    marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 10,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.bgTer, borderWidth: 1, borderColor: colors.borderLight,
  },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  name: { color: colors.pri, fontWeight: "700", fontSize: 14, flex: 1 },
});