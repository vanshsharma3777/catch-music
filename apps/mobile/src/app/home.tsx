import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import { api } from "../lib/api";
import { AmbientBackground } from "../components/ui/AmbientBackground";
import { GlowCard } from "../components/ui/GlowCard";
import { GoldButton } from "../components/ui/GoldButton";
import { useAuth } from "../providers/AuthProvider";

type Profile = { user: { name: string; email: string; username: string } };

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, signOut } = useAuth();
  const [data, setData] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "signedIn") return;
    console.log("status " , status)
    api<Profile>("/api/debug/me")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [status]);
  console.log("PROFILE DATD" , data)
  if (status !== "signedIn") return <Redirect href={"/welcome" as never} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <AmbientBackground />
      <GlowCard strong innerStyle={{ gap: 12 }}>
        <Text style={styles.title}>Token check</Text>
        {!data && !error && <ActivityIndicator color={colors.accent} />}
        {data && (
          <>
            <Text style={styles.ok}>Connected to your API</Text>
            <Text style={styles.line}>Name: {data.user.name}</Text>
            <Text style={styles.line}>Email: {data.user.email}</Text>
          </>
        )}
        {error && <Text style={styles.err}>{error}</Text>}
      </GlowCard>

      <GoldButton
        label="Sign out"
        variant="ghost"
        onPress={() => {
          signOut();
          router.replace("/welcome" as never);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, justifyContent: "center", gap: 20 },
  title: { color: colors.pri, fontSize: 22, fontWeight: "800" },
  ok: { color: colors.success, fontWeight: "700" },
  line: { color: colors.sec, fontSize: 14 },
  err: { color: colors.error, fontSize: 13 },
});