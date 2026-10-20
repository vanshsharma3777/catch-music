import { useRef } from "react";
import type { ComponentRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import { AmbientBackground } from "../components/ui/AmbientBackground";
import { Marquee } from "../components/ui/Marquee";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Reviews } from "../components/landing/Reviews";
import { FinalCta } from "../components/landing/FinalCta";
import { StickyHeader } from "../components/landing/StickyHeader";

const TICKER = ["Offline playback", "Zero ads", "No premium needed", "Likes & playlists", "Smart storage"];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const featuresY = useRef(0);

  const goStart = () => router.push("/signin" as never);
  const goFeatures = () => scroll.current?.scrollTo({ y: featuresY.current - 70, animated: true });

  return (
    <View style={styles.root}>
      <AmbientBackground />

      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => scrollY.setValue(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 }}
      >
        <View style={styles.pad}>
          <Hero onStart={goStart} onExplore={goFeatures} />
        </View>

        <View style={styles.section}>
          <Marquee items={TICKER} />
        </View>

        <View
          style={[styles.pad, styles.section]}
          onLayout={(e) => (featuresY.current = e.nativeEvent.layout.y)}
        >
          <Features />
        </View>

        <View style={[styles.pad, styles.section]}>
          <HowItWorks />
        </View>

        <View style={styles.section}>
          <Reviews />
        </View>

        <View style={[styles.pad, styles.section]}>
          <FinalCta onStart={goStart} />
        </View>
      </ScrollView>

      <StickyHeader scrollY={scrollY} top={insets.top} onStart={goStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 24 },
  section: { marginTop: 64 },
});