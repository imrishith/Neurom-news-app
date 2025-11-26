import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";
import { fw, fh, ff } from "../../../utils/responsive";

const { width: SCREEN_W } = Dimensions.get("window");
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const ArticleTextModeShimmer = () => {
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
      />

      {/* Category + Toggle */}
      <View style={styles.chipRow}>
        <ShimmerPlaceholder
          ref={chipRef}
          stopAutoRun
          style={styles.chip}
        />

        <ShimmerPlaceholder
          ref={toggleRef}
          stopAutoRun
          style={styles.toggle}
        />
      </View>

      {/* Title */}
      <ShimmerPlaceholder
        ref={titleRef}
        stopAutoRun
        style={styles.title}
      />

      {/* Description (3 lines) */}
      <ShimmerPlaceholder
        ref={desc1Ref}
        stopAutoRun
        style={styles.desc}
      />
      <ShimmerPlaceholder
        ref={desc2Ref}
        stopAutoRun
        style={styles.desc}
      />
      <ShimmerPlaceholder
        ref={desc3Ref}
        stopAutoRun
        style={[styles.desc, { width: "70%" }]}
      />

      {/* Interactions Row */}
      <ShimmerPlaceholder
        ref={interactionRef}
        stopAutoRun
        style={styles.interactions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_W,
    padding: fw(16),
    paddingTop: fh(55),
  },

  image: {
    width: "100%",
    height: fh(260),
    borderRadius: fw(16),
  },

  chipRow: {
    marginTop: fh(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  chip: {
    width: fw(90),
    height: fh(26),
    borderRadius: fw(20),
  },

  toggle: {
    width: fw(110),
    height: fh(28),
    borderRadius: fw(20),
  },

  title: {
    marginTop: fh(16),
    width: "85%",
    height: fh(20),
    borderRadius: fh(6),
  },

  desc: {
    marginTop: fh(10),
    width: "95%",
    height: fh(18),
    borderRadius: fh(6),
  },

  interactions: {
    marginTop: fh(150),
    width: "100%",
    height: fh(40),
    borderRadius: fw(12),
  },
});

export default ArticleTextModeShimmer;
