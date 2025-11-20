// components/CardDeck.tsx
import React, { useState, useEffect } from "react";
import { StyleSheet, Dimensions, View, Text } from "react-native";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { height } = Dimensions.get("window");
const SWIPE_THRESHOLD = height * 0.15;

interface CardDeckProps {
  data: any[];
  renderCard: (item: any, index: number) => React.ReactNode;
  swipeEnabled?: boolean;
  initialIndex?: number;
  onIndexChange?: (index: number) => void; // ✅ notify parent
}

export default function CardDeck({
  data = [],
  renderCard,
  swipeEnabled = true,
  initialIndex = 0,
  onIndexChange,
}: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when initialIndex or data changes
  useEffect(() => {
    if (initialIndex < data.length) {
      setCurrentIndex(initialIndex);
    } else {
      setCurrentIndex(0);
    }
  }, [initialIndex, data.length]);

  // Shared values
  const translateY = useSharedValue(0);
  const prevCardTranslateY = useSharedValue(-height);
  const isAnimating = useSharedValue(false);

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex); // ✅ notify parent
    }
    translateY.value = 0;
    prevCardTranslateY.value = -height;
    isAnimating.value = false;
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex); // ✅ notify parent
    }
    translateY.value = 0;
    prevCardTranslateY.value = -height;
    isAnimating.value = false;
  };

  // Gesture — vertical only
  const gesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // ignore horizontal swipes
    .onUpdate((e) => {
      if (!swipeEnabled || isAnimating.value) return;
      translateY.value = e.translationY;

      if (e.translationY > 0) {
        prevCardTranslateY.value = e.translationY - height;
      }
    })
    .onEnd((e) => {
      if (!swipeEnabled || isAnimating.value) return;

      if (e.translationY < -SWIPE_THRESHOLD && currentIndex < data.length - 1) {
        isAnimating.value = true;
        translateY.value = withTiming(-height, { duration: 250 }, () =>
          runOnJS(handleNext)()
        );
      } else if (e.translationY > SWIPE_THRESHOLD && currentIndex > 0) {
        isAnimating.value = true;
        translateY.value = withTiming(0, { duration: 150 });
        prevCardTranslateY.value = withTiming(0, { duration: 250 }, () =>
          runOnJS(handlePrev)()
        );
      } else {
        translateY.value = withTiming(0, { duration: 150 });
        prevCardTranslateY.value = withTiming(-height, { duration: 150 });
      }
    })
    .simultaneousWithExternalGesture();

  // Animated styles
  const currentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1,
    zIndex: 3,
  }));

  const previousStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: prevCardTranslateY.value }],
    opacity: 1,
    zIndex: 2,
  }));

  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
    zIndex: 1,
  }));

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text>No articles available</Text>
      </View>
    );
  }

  const current = data[currentIndex];
  const prev = currentIndex > 0 ? data[currentIndex - 1] : null;
  const next = currentIndex < data.length - 1 ? data[currentIndex + 1] : null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <View style={styles.container}>
          {/* Previous card */}
          {prev && (
            <Animated.View
              key={`prev-${prev.article_id || currentIndex - 1}`}
              style={[styles.card, previousStyle]}
            >
              {renderCard(prev, currentIndex - 1)}
            </Animated.View>
          )}

          {/* Current card */}
          {current && (
            <Animated.View
              key={`curr-${current.article_id || currentIndex}`}
              style={[styles.card, currentStyle]}
            >
              {renderCard(current, currentIndex)}
            </Animated.View>
          )}

          {/* Next card */}
          {next && (
            <Animated.View
              key={`next-${next.article_id || currentIndex + 1}`}
              style={[styles.card, nextStyle]}
            >
              {renderCard(next, currentIndex + 1)}
            </Animated.View>
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const { height: SCREEN_H } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    position: "absolute",
    width: "100%",
    height: SCREEN_H * 0.9,
    borderRadius: 16,
    overflow: "hidden",
  },
});
