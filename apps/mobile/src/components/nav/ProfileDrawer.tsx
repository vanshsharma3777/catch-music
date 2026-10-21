import { useEffect, useRef, useState } from "react";
import {
  Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gold, radius } from "../../constants/theme";
import { useAuth } from "../../providers/AuthProvider";
import { usePlayer } from "../../providers/PlayerProvider";
import type { Profile } from "../../hooks/useProfile";

type IconName = keyof typeof Ionicons.glyphMap;

type Item = { icon: IconName; label: string; route: string };

const ITEMS: Item[] = [
  { icon: "person-outline", label: "Your profile", route: "/profile" },
  { icon: "heart-outline", label: "Liked songs", route: "/liked" },
  { icon: "list-outline", label: "Created playlists", route: "/playlists" },
  { icon: "bookmark-outline", label: "Saved playlists", route: "/saved-playlists" },
  { icon: "arrow-down-circle-outline", label: "Offline songs", route: "/offline" },
  { icon: "options-outline", label: "Change favourite artists", route: "/artists-setup" },
];

export function Avatar({ profile, size }: { profile: Profile | null; size: number }) {
  const [failed, setFailed] = useState(false);
  const initial = (profile?.name || "?").trim().charAt(0).toUpperCase();

  useEffect(() => setFailed(false), [profile?.image]);

  return (
    <LinearGradient
      colors={gold}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, padding: 1.5 }}
    >
      <View style={[styles.avatarInner, { borderRadius: size / 2 }]}>
        {profile?.image && !failed ? (
          <Image
            source={{ uri: profile.image }}
            style={StyleSheet.absoluteFill}
            onError={() => setFailed(true)}
          />
        ) : (
          <Text style={{ color: colors.accent, fontWeight: "900", fontSize: size * 0.4 }}>{initial}</Text>
        )}
      </View>
    </LinearGradient>
  );
}

export function ProfileDrawer({
  visible,
  onClose,
  profile,
}: {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { signOut } = useAuth();
  const { closePlayer } = usePlayer();

  const panelW = Math.min(340, width * 0.78);
  const [mounted, setMounted] = useState(visible);
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(t, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(t, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
        ({ finished }) => finished && setMounted(false)
      );
    }
  }, [visible]);

  const go = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as never), 120);
  };

  const logout = () => {
    onClose();
    closePlayer();
    signOut();
    router.replace("/welcome" as never);
  };

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* tapping anywhere outside the card closes it */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: t }]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            top: insets.top + 64,
            width: panelW,
            maxHeight: height * 0.72,
            opacity: t,
            transform: [
              { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
              { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}
      >
        <LinearGradient colors={[colors.surface, colors.card]} style={styles.panelInner}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* who you are */}
            <Pressable onPress={() => go("/profile")} style={styles.who}>
              <Avatar profile={profile} size={54} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{profile?.name || "Music Lover"}</Text>
                <Text style={styles.mail} numberOfLines={1}>
                  {profile?.username ? `@${profile.username}` : profile?.email || ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>

            <View style={styles.line} />

            {ITEMS.map((it) => (
              <Pressable
                key={it.label}
                onPress={() => go(it.route)}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: "rgba(255,255,255,0.06)" }]}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={it.icon} size={18} color={colors.accent} />
                </View>
                <Text style={styles.itemText}>{it.label}</Text>
              </Pressable>
            ))}

            <View style={styles.line} />

            <Pressable
              onPress={logout}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: "rgba(239,68,68,0.10)" }]}
            >
              <View style={[styles.iconBox, { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.25)" }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
              </View>
              <Text style={[styles.itemText, { color: colors.error }]}>Sign out</Text>
            </Pressable>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avatarInner: {
    flex: 1, backgroundColor: colors.bgTer, alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  panel: {
    position: "absolute",
    right: 14,
    borderRadius: radius.lg,
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 24,
  },
  panelInner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: 8,
    overflow: "hidden",
  },
  who: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10 },
  name: { color: colors.pri, fontSize: 16, fontWeight: "800" },
  mail: { color: colors.sec, fontSize: 12, marginTop: 2 },
  line: { height: 1, backgroundColor: colors.borderLight, marginVertical: 6, marginHorizontal: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 14 },
  iconBox: {
    width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  itemText: { color: colors.pri, fontSize: 14, fontWeight: "700" },
});

export default ProfileDrawer;