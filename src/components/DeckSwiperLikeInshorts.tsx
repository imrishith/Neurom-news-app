// components/DeckSwiperLikeInshorts.tsx
import React, { useEffect, useMemo } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { height: SCREEN_H } = Dimensions.get("window");

type IndexChange = (index: number) => void;

interface Props<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onIndexChange?: IndexChange;
  extraKey?: any;
  initialIndex?: number;
}

export default function DeckSwiperLikeInshorts<T>(props: Props<T>) {
  const { data, renderCard, onIndexChange, extraKey, initialIndex = 0 } = props;

  // Position of the vertical stack (0 at first card, -H at second, etc.)
  const translateY = useSharedValue(-initialIndex * SCREEN_H);
  const startY = useSharedValue(translateY.value);
  const currentIndex = useSharedValue(initialIndex);

  // Update translate when initialIndex changes
  useEffect(() => {
    translateY.value = withTiming(-initialIndex * SCREEN_H, { duration: 0 });
    currentIndex.value = initialIndex;
  }, [initialIndex, extraKey]);

  // Gesture definition
  const pan = useMemo(() => {
    const maxOffset = -((data.length - 1) * SCREEN_H);
    const minOffset = 0;

    const SPRING = { damping: 18, stiffness: 180, mass: 0.9 } as const;
    const VELOCITY_TRIGGER = 800; // px/s threshold to advance page
    const PROGRESS_TRIGGER = 0.33; // fraction of page to advance on slow drags

    const _clamp = (v: number, min: number, max: number) => {
      'worklet';
      return v < min ? min : v > max ? max : v;
    };

    return Gesture.Pan()
      .onBegin(() => {
        startY.value = translateY.value;
      })
      .onChange((e) => {
        // 1:1 finger tracking
        const next = startY.value + e.translationY;
        translateY.value = _clamp(next, maxOffset, minOffset);
      })
      .onEnd((e) => {
        // Compute destination index using velocity + progress
        const raw = -translateY.value / SCREEN_H;
        const progress = raw - Math.floor(raw);
        let dest = Math.round(raw);

        const v = e.velocityY; // px/s (positive when swiping down)
        if (Math.abs(v) > VELOCITY_TRIGGER) {
          dest = v > 0 ? Math.floor(raw) : Math.ceil(raw);
        } else {
          if (progress > PROGRESS_TRIGGER) dest = Math.ceil(raw);
          else dest = Math.floor(raw);
        }

        // Clamp destination
        dest = Math.max(0, Math.min(dest, data.length - 1));
        const target = -dest * SCREEN_H;

        // Snap with spring
        translateY.value = withSpring(target, SPRING, (finished) => {
          if (finished && dest !== currentIndex.value) {
            currentIndex.value = dest;
            if (onIndexChange) runOnJS(onIndexChange)(dest);
          }
        });
      });
  }, [data.length, onIndexChange]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={styles.wrapper}>
        <Animated.View style={[styles.stack, { height: data.length * SCREEN_H }, containerStyle]}>
          {data.map((item, idx) => (
            <View key={`card-${idx}-${extraKey ?? ""}`} style={styles.card}>
              {renderCard(item, idx)}
            </View>
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: "hidden",
  },
  stack: {
    width: "100%",
  },
  card: {
    height: SCREEN_H,
    width: "100%",
  },
});


import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  Easing
} from "react-native";
 

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

interface DeckSwiperProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  initialIndex?: number;
  currentIndex: number;
  onIndexChange?: (index: number) => void;
  onCardPress?: (item: T, index: number) => void;
  cardHeight?: number;
  swipeEnabled?: boolean;
  extraKey?: any;
}

export default class DeckSwiper<T> extends Component<DeckSwiperProps<T>> {
  position = new Animated.ValueXY();
  panResponder: any;

  state = {
    animatedIndex: this.props.currentIndex,
    isAnimatingSwipe: false,
  };

  constructor(props: DeckSwiperProps<T>) {
    super(props);
    this.setupPanResponder();
  }

  static getDerivedStateFromProps(
    nextProps: DeckSwiperProps<T>,
    prevState: { animatedIndex: number; isAnimatingSwipe: boolean }
  ) {
    if (
      nextProps.currentIndex !== prevState.animatedIndex &&
      !prevState.isAnimatingSwipe
    ) {
      return { animatedIndex: nextProps.currentIndex };
    }
    return null;
  }

  componentDidUpdate(
    prevProps: DeckSwiperProps<T>,
    prevState: { animatedIndex: number; isAnimatingSwipe: boolean }
  ) {
    if (
      this.props.currentIndex !== prevProps.currentIndex &&
      !this.state.isAnimatingSwipe
    ) {
      this.position.setValue({ x: 0, y: 0 });
    }
  }

  setupPanResponder() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        if (this.state.isAnimatingSwipe) {
          this.position.stopAnimation();
          this.setState({ isAnimatingSwipe: false });
        }
        this.position.setOffset({ x: 0, y: this.position.y._value });
        this.position.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, g) => {
        if (this.props.swipeEnabled === false) return;
        this.position.setValue({ x: 0, y: g.dy });
      },
     onPanResponderRelease: (_, g) => {
  if (!this.props.swipeEnabled) {
    Animated.spring(this.position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
    return;
  }

  const { data, onIndexChange } = this.props;
  const { animatedIndex } = this.state;

  // ✅ Much lower distance threshold and responsive velocity trigger
  const SWIPE_DISTANCE_THRESHOLD = SCREEN_HEIGHT * 0.05; // very short swipe
  const SWIPE_VELOCITY_THRESHOLD = 0.25; // trigger even for short, fast flicks

  // ✅ Detect direction with combined distance & velocity
  const swipeUp =
    (-g.dy > SWIPE_DISTANCE_THRESHOLD || -g.vy > SWIPE_VELOCITY_THRESHOLD) &&
    animatedIndex < data.length - 1;
  const swipeDown =
    (g.dy > SWIPE_DISTANCE_THRESHOLD || g.vy > SWIPE_VELOCITY_THRESHOLD) &&
    animatedIndex > 0;

  if (swipeUp || swipeDown) {
    const nextIndex = swipeUp ? animatedIndex + 1 : animatedIndex - 1;

    // ✅ Travel a bit less than full height for snappier switch
    const targetY = swipeUp ? -SCREEN_HEIGHT * 0.9 : SCREEN_HEIGHT * 0.9;

    this.setState({ isAnimatingSwipe: true }, () => {
      Animated.timing(this.position, {
  toValue: { x: 0, y: targetY },
  duration: 50,                        // 🔹 shorter = faster
  easing: Easing.linear,               // 🔹 no deceleration lag
  useNativeDriver: true,
}).start(() => {
  this.position.setValue({ x: 0, y: 0 });
  this.setState({ animatedIndex: nextIndex, isAnimatingSwipe: false });
  onIndexChange?.(nextIndex);
});

    });
  } else {
    // 🌀 Quick rebound for partial swipes
    Animated.spring(this.position, {
      toValue: { x: 0, y: 0 },
      speed: 30,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }
}


    });
  }

  handleCardPress = (item: T, index: number) => {
    if (this.props.onCardPress) {
      this.props.onCardPress(item, index);
    }
  };

  renderCards = () => {
    const { data, renderCard, cardHeight = SCREEN_HEIGHT, extraKey } =
      this.props;
    const { animatedIndex } = this.state;

    if (data.length === 0) {
      return (
        <View style={styles.empty}>
          <Animated.Text>No items available</Animated.Text>
        </View>
      );
    }

    const cardsToRender = data
      .slice(
        Math.max(0, animatedIndex - 1),
        Math.min(data.length, animatedIndex + 2)
      )
      .map((item, i) => {
        const actualIndex = Math.max(0, animatedIndex - 1) + i;
        const isCurrent = actualIndex === animatedIndex;
        const isNext = actualIndex === animatedIndex + 1;
        const isPrevious = actualIndex === animatedIndex - 1;

        let cardStyle: any = {};
        let animatedProps: any = {};
        let overlayOpacity: Animated.AnimatedInterpolation<number> | number = 0;

        if (isCurrent) {
          const translateY = this.position.y.interpolate({
            inputRange: [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
            outputRange: [-SCREEN_HEIGHT, 0, 0],
            extrapolate: "clamp",
          });

          const scale = this.position.y.interpolate({
            inputRange: [0, SCREEN_HEIGHT],
            outputRange: [1, 0.9],
            extrapolate: "clamp",
          });

          // Overlay on current card when swiping down
          overlayOpacity = this.position.y.interpolate({
            inputRange: [0, SCREEN_HEIGHT],
            outputRange: [0, 0.6],
            extrapolate: "clamp",
          });

          cardStyle = { transform: [{ translateY }, { scale }] };
          animatedProps = { ...this.panResponder.panHandlers };
        } else if (isNext) {
          const scale = this.position.y.interpolate({
            inputRange: [-SCREEN_HEIGHT, 0],
            outputRange: [1, 0.9],
            extrapolate: "clamp",
          });

          // Overlay on next card when swiping up
          overlayOpacity = this.position.y.interpolate({
            inputRange: [-SCREEN_HEIGHT, 0],
            outputRange: [0, 0.6],
            extrapolate: "clamp",
          });

          cardStyle = { transform: [{ scale }] };
        } else if (isPrevious) {
          const translateY = this.position.y.interpolate({
            inputRange: [0, SCREEN_HEIGHT],
            outputRange: [-SCREEN_HEIGHT, 0],
            extrapolate: "clamp",
          });

          cardStyle = { transform: [{ translateY }] };
        }

        return (
          <Animated.View
            key={`${actualIndex}-${extraKey}`}
            style={[styles.cardWrapper, { height: cardHeight }, cardStyle]}
            {...animatedProps}
          >
            <TouchableWithoutFeedback
              onPress={() => this.handleCardPress(item, actualIndex)}
            >
              <View style={{ flex: 1 }}>
                {renderCard(item, actualIndex)}
                {(isNext || isCurrent) && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFillObject,
                      { backgroundColor: "black", opacity: overlayOpacity },
                    ]}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        );
      });

    return cardsToRender.reverse();
  };

  render() {
    return <View style={{ flex: 1 }}>{this.renderCards()}</View>;
  }
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: "absolute",           // ✅ keep absolute for performance
    width: SCREEN_WIDTH,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
