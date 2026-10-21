import { useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius } from "../../constants/theme";
import { SectionHeading } from "../ui/SectionHeading";
import { GlowCard } from "../ui/GlowCard";
import { FEATURES, type Feature } from "./landingData";

const GAP = 14;

function FeatureCard({ item, index, width }: { item: Feature; index: number; width: number }) {
  return (
    <View style={{ width }}>
      <GlowCard strong corner={radius.lg} style={{ flex: 1 }} innerStyle={{ gap: 6, minHeight: 250 }}>
        <View style={styles.top}>
          <View style={styles.icon}>
            <Feather name={item.icon} size={22} color={colors.accent} />
          </View>
          <Text style={styles.num}>{String(index + 1).padStart(2, "0")}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.tag}>{item.tag.toUpperCase()}</Text>
        <Text style={styles.text}>{item.text}</Text>
      </GlowCard>
    </View>
  );
}

export function Features() {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width * 0.78, 330);
  const [active, setActive] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (cardW + GAP));
    if (i !== active && i >= 0 && i < FEATURES.length) setActive(i);
  };

  return (
    <View style={{ gap: 24 }}>
      <View style={{ paddingHorizontal: 24 }}>
        <SectionHeading tag="Features" title="Powerful Features." highlight="Built for Music Lovers." />
      </View>

      <FlatList
        data={FEATURES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(f) => f.title}
        snapToInterval={cardW + GAP}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 24, gap: GAP }}
        renderItem={({ item, index }) => <FeatureCard item={item} index={index} width={cardW} />}
      />

      <View style={styles.dots}>
        {FEATURES.map((f, i) => (
          <View key={f.title} style={[styles.pip, i === active && styles.pipOn]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  icon: {
    width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  num: { color: colors.muted, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.pri, fontSize: 23, fontWeight: "800", letterSpacing: -0.5 },
  tag: { color: colors.primary, fontSize: 10, fontWeight: "700", letterSpacing: 1.6 },
  text: { color: colors.sec, fontSize: 14.5, lineHeight: 22, marginTop: 8 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  pip: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderLight },
  pipOn: { width: 22, backgroundColor: colors.primary },
});