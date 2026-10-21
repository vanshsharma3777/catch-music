import { Redirect, Tabs } from "expo-router";
import { colors } from "../../constants/theme";
import { TabBar } from "../../components/nav/TabBar";
import { useAuth } from "../../providers/AuthProvider";

export default function TabsLayout() {
  const { status } = useAuth();
  if (status !== "signedIn") return <Redirect href={"/welcome" as never} />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props as any} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="offline" />
    </Tabs>
  );
}