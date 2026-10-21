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
import { OfflineMoment } from "../components/landing/OfflineMoment";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Reviews } from "../components/landing/Reviews";
import { FinalCta } from "../components/landing/FinalCta";
import { StickyHeader } from "../components/landing/StickyHeader";
import { Reveal, ScrollProvider } from "../components/landing/ScrollReveal";
import { TICKER } from "../components/landing/landingData";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const featuresY = useRef(0);

  const goStart = () => router.push("/signin" as never);
  const goFeatures = () =>
    scroll.current?.scrollTo({ y: Math.max(0, featuresY.current - 70), animated: true });

  return (
    <View style={styles.root}>
      <AmbientBackground />

      <ScrollProvider value={scrollY}>
        <ScrollView
          ref={scroll}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => scrollY.setValue(e.nativeEvent.contentOffset.y)}
          contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 56 }}
        >
          <View style={styles.pad}>
            <Hero onStart={goStart} onExplore={goFeatures} />
          </View>

          <Reveal style={styles.section}>
            <Marquee items={TICKER} />
          </Reveal>

          <Reveal
            style={styles.section}
            // Reveal wraps the View below; we read its position for "Explore Features"
          >
            <View onLayout={() => undefined}>
              <View
                onLayout={(e) => {
                  featuresY.current = e.nativeEvent.layout.y;
                }}
              />
              <Features />
            </View>
          </Reveal>

          <Reveal style={[styles.pad, styles.section]}>
            <OfflineMoment />
          </Reveal>

          <Reveal style={[styles.pad, styles.section]}>
            <HowItWorks />
          </Reveal>

          <Reveal style={styles.section}>
            <Reviews />
          </Reveal>

          <Reveal style={[styles.pad, styles.section]}>
            <FinalCta onStart={goStart} />
          </Reveal>
        </ScrollView>
      </ScrollProvider>

      <StickyHeader scrollY={scrollY} top={insets.top} onStart={goStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 24 },
  section: { marginTop: 72 },
});