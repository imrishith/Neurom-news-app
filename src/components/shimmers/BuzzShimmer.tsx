import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";
import { fw, fh, ff } from "../../../utils/responsive";

const { width: SCREEN_W } = Dimensions.get("window");
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const BuzzShimmer = () => {
  // refs
  const imageRef = useRef<any>();
  const titleRef = useRef<any>();
  const desc1Ref = useRef<any>();
  const desc2Ref = useRef<any>();
  const desc3Ref = useRef<any>();
  const chipRef = useRef<any>();
  const toggleRef = useRef<any>();
  const interactionRef = useRef<any>();

  useEffect(() => {
    const anim = Animated.stagger(250, [
      imageRef.current?.getAnimated?.(),
      chipRef.current?.getAnimated?.(),
      titleRef.current?.getAnimated?.(),
      Animated.parallel([
        desc1Ref.current?.getAnimated?.(),
        desc2Ref.current?.getAnimated?.(),
        desc3Ref.current?.getAnimated?.()
      ]),
      interactionRef.current?.getAnimated?.(),
    ]);

    Animated.loop(anim).start();
  }, []);

  return (
    <View style={styles.card}>
      {/* Image */}
      <ShimmerPlaceholder
        ref={imageRef}
        stopAutoRun
        style={styles.image}
        shimmerColors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
      />


      {/* Interactions Row */}
      <ShimmerPlaceholder
        ref={interactionRef}
        stopAutoRun
        style={styles.interactions}
        shimmerColors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_W,
    padding: fw(16),

  },

  image: {
    width: "100%",
    height: fh(300),
    borderRadius: fw(16),
  },




  interactions: {
    marginTop: fh(150),
    width: "100%",
    height: fh(40),
    borderRadius: fw(12),
  },
});

export default BuzzShimmer;
