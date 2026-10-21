import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import { AuthProvider } from "../providers/AuthProvider";
import { PlayerProvider } from "../providers/PlayerProvider";
import { MiniPlayer } from "../components/player/MiniPlayer";
import { FullPlayer } from "../components/player/FullPlayer";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "fade",
            }}
          />
          <MiniPlayer />
          <FullPlayer />
        </PlayerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}