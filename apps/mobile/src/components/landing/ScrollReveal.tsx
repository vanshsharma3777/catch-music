import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from "react-native";

const ScrollCtx = createContext<Animated.Value | null>(null);
export const ScrollProvider = ScrollCtx.Provider;

type Props = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
};

export function Reveal({ children, delay = 0, distance = 40, style }: Props) {
  const scrollY = useContext(ScrollCtx);
  const { height } = useWindowDimensions();

  const v = useRef(new Animated.Value(0)).current;
  const shown = useRef(false);
  const top = useRef<number | null>(null);
  const offset = useRef(0);

  const play = useCallback(() => {
    if (shown.current) return;
    shown.current = true;
    Animated.timing(v, {
      toValue: 1,
      duration: 750,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, delay]);

  const check = useCallback(() => {
    if (top.current !== null && offset.current + height * 0.92 > top.current) play();
  }, [height, play]);

  useEffect(() => {
    if (!scrollY) {
      play();
      return;
    }
    const id = scrollY.addListener(({ value }) => {
      offset.current = value;
      check();
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, check, play]);

  const onLayout = (e: LayoutChangeEvent) => {
    top.current = e.nativeEvent.layout.y;
    check();
  };

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}