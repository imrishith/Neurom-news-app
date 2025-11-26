import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_H } = Dimensions.get("window");

function clamp(n: number, min: number, max: number) {
  "worklet";
  return Math.max(min, Math.min(n, max));
}

function computeNextIndex(
  dy: number,
  current: number,
  count: number,
  threshold: number,
  loop: boolean
) {
  "worklet";
  if (count === 0) return 0;
  if (Math.abs(dy) <= threshold) return current;

  const goingUp = dy < 0;
  let target = current + (goingUp ? 1 : -1);

  if (target >= count) target = loop ? 0 : current;
  if (target < 0) target = loop ? count - 1 : current;

  return target;
}

export type InshortsSwiperRef = {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
};

export type InshortsSwiperProps = {
  data: any[];
  renderCard: (item: any, index: number) => React.ReactNode;
  initialIndex?: number;
  swipeThreshold?: number;
  animationDurationMs?: number;
  onIndexChange?: (index: number) => void;
  onEndReached?: () => void;
  loop?: boolean;
  style?: object;
  backgroundColor?: string;
  preloadCount?: number;
};

export const InshortsSwiper = React.forwardRef<
  InshortsSwiperRef,
  InshortsSwiperProps
>((props, ref) => {
  const {
    data,
    renderCard,
    initialIndex = 0,
    swipeThreshold = SCREEN_H * 0.18,
    animationDurationMs = 220,
    onIndexChange,
    onEndReached,
    loop = false,
    style,
    backgroundColor = "#000",
    preloadCount = 1,
  } = props;

  const count = data?.length ?? 0;
  const [index, setIndex] = useState(() =>
    clamp(initialIndex, 0, count - 1)
  );

  const translateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);
  const isAnimatingJS = useRef(false);

  const setAnimatingJS = useCallback((v: boolean) => {
    isAnimatingJS.current = v;
  }, []);

  const changeIndex = useCallback(
    (next: number) => {
      setIndex(next);
      onIndexChange?.(next);
      if (next >= count - 1) onEndReached?.();
    },
    [count, onIndexChange, onEndReached]
  );

  const animateToIndex = useCallback(
    (to: number, targetIdx: number) => {
      runOnUI(
        (toVal: number, idx: number, duration: number) => {
          "worklet";
          if (isAnimating.value) return;
          isAnimating.value = true;
          runOnJS(setAnimatingJS)(true);

          translateY.value = withTiming(
            toVal,
            { duration },
            (finished) => {
              if (finished) {
                translateY.value = 0;
                isAnimating.value = false;
                runOnJS(setAnimatingJS)(false);
                runOnJS(changeIndex)(idx);
              } else {
                isAnimating.value = false;
                runOnJS(setAnimatingJS)(false);
              }
            }
          );
        }
      )(to, targetIdx, animationDurationMs);
    },
    [animationDurationMs, changeIndex]
  );

  // ✅ Public API
  useImperativeHandle(ref, () => ({
    next() {
      if (!count || isAnimatingJS.current) return;
      const nextIdx = index + 1;
      if (nextIdx < count) animateToIndex(-SCREEN_H, nextIdx);
      else if (loop) animateToIndex(-SCREEN_H, 0);
    },
    prev() {
      if (!count || isAnimatingJS.current) return;
      const prevIdx = index - 1;
      if (prevIdx >= 0) animateToIndex(SCREEN_H, prevIdx);
      else if (loop) animateToIndex(SCREEN_H, count - 1);
    },
    goTo(target: number) {
      if (!count || isAnimatingJS.current) return;
      const safe = clamp(target, 0, count - 1);
      if (safe === index) return;
      const dir = safe > index ? -SCREEN_H : SCREEN_H;
      animateToIndex(dir, safe);
    },
  }));

  // ✅ Gesture
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          if (isAnimating.value) return;
          translateY.value = e.translationY;
        })
        .onEnd((e) => {
          if (isAnimating.value) {
            translateY.value = withSpring(0);
            return;
          }
          const targetIdx = computeNextIndex(
            e.translationY,
            index,
            count,
            swipeThreshold,
            loop
          );
          if (targetIdx !== index) {
            const goingUp = e.translationY < 0;
            animateToIndex(goingUp ? -SCREEN_H : SCREEN_H, targetIdx);
          } else {
            translateY.value = withSpring(0);
          }
        }),
    [count, index, swipeThreshold, loop]
  );

  // ✅ Styles
  const currentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const aboveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value - SCREEN_H }],
    opacity: 0.9,
  }));

  const belowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + SCREEN_H }],
    opacity: 0.9,
  }));

  // ✅ Windowing for perf
  const windowed = useMemo(() => {
    const items: { item: any; key: string; realIndex: number }[] = [];
    for (let offset = -preloadCount; offset <= preloadCount; offset++) {
      const realIndex = index + offset;
      if (realIndex < 0 || realIndex >= count) continue;
      items.push({
        item: data[realIndex],
        key: String(realIndex),
        realIndex,
      });
    }
    return items;
  }, [count, data, index, preloadCount]);

  const currentKey = String(index);

  if (!count)
    return (
      <View
        style={[styles.container, { backgroundColor }, style]}
      />
    );

  return (
    <View
      style={[styles.container, { backgroundColor }, style]}
    >
      <GestureDetector gesture={pan}>
        <View style={styles.fill}>
          {windowed.map(({ item, key, realIndex }) => {
            const isCurrent = key === currentKey;
            const isAbove = realIndex < index;
            const animatedStyle = isCurrent
              ? currentStyle
              : isAbove
              ? aboveStyle
              : belowStyle;
            return (
              <Animated.View
                key={key}
                style={[styles.page, animatedStyle]}
              >
                <View style={styles.pageInner}>
                  {renderCard(item, realIndex)}
                </View>
              </Animated.View>
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  fill: { flex: 1 },
  page: { ...StyleSheet.absoluteFillObject },
  pageInner: { flex: 1 },
});
