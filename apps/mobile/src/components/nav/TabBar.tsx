import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { MiniPlayer } from "../player/MiniPlayer";

type IconName = keyof typeof Ionicons.glyphMap;

export type TabBarProps = {
state: {
index: number;
routes: { key: string; name: string }[];
};
navigation: {
emit: (options: {
type: "tabPress";
target: string;
canPreventDefault: true;
}) => { defaultPrevented: boolean };
navigate: (name: string) => void;
};
};

const TABS: Record<string, { label: string; on: IconName; off: IconName }> = {
home: { label: "Home", on: "home", off: "home-outline" },
search: { label: "Search", on: "search", off: "search-outline" },
offline: {
label: "Offline",
on: "arrow-down-circle",
off: "arrow-down-circle-outline",
},
};

export function TabBar({ state, navigation }: TabBarProps) {
const insets = useSafeAreaInsets();

return ( <View style={styles.wrap}> <MiniPlayer />

  <View
    style={[
      styles.bar,
      { paddingBottom: Math.max(insets.bottom, 10) },
    ]}
  >
    {state.routes.map((route, index) => {
      const tab = TABS[route.name];
      if (!tab) return null;

      const focused = state.index === index;

      return (
        <Pressable
          key={route.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: focused }}
          onPress={() => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }}
          style={styles.item}
        >
          <View style={[styles.glow, focused && styles.glowOn]} />

          <Ionicons
            name={focused ? tab.on : tab.off}
            size={23}
            color={focused ? colors.accent : colors.muted}
          />

          <Text
            style={[
              styles.label,
              { color: focused ? colors.accent : colors.muted },
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
</View>

);
}

const styles = StyleSheet.create({
wrap: { backgroundColor: colors.bg },
bar: {
flexDirection: "row",
paddingTop: 8,
backgroundColor: "rgba(3,3,3,0.98)",
borderTopWidth: 1,
borderTopColor: colors.borderLight,
},
item: {
flex: 1,
alignItems: "center",
gap: 3,
paddingVertical: 2,
},
glow: {
position: "absolute",
top: -9,
width: 26,
height: 3,
borderRadius: 2,
backgroundColor: "transparent",
},
glowOn: {
backgroundColor: colors.primary,
shadowColor: colors.primary,
shadowOpacity: 0.9,
shadowRadius: 8,
shadowOffset: { width: 0, height: 0 },
},
label: {
fontSize: 11,
fontWeight: "700",
letterSpacing: 0.3,
},
});

export default TabBar;
