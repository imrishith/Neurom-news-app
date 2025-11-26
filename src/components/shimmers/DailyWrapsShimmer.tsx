import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { fw, fh } from "../../../utils/responsive";

const Shimmer = createShimmerPlaceholder(LinearGradient);

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

export default function DailyWrapsShimmer() {
  return (
    <View style={styles.container}>
      {/* 🔹 Video area shimmer */}
      <Shimmer
        style={styles.videoShimmer}
        shimmerStyle={{ borderRadius: 0 }}
      />

      {/* Gradient overlay mimic */}
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.topGradient}
      />

      {/* 🔹 Title Shimmer */}
      <View style={styles.titleContainer}>
        <Shimmer style={styles.titleLine1} />
        <Shimmer style={styles.titleLine2} />
      </View>

      {/* 🔹 Bottom Interaction Row shimmer */}
      <View style={styles.bottomContainer}>
        <Shimmer style={styles.interactionIcon} />
        <Shimmer style={styles.interactionIcon} />
        <Shimmer style={styles.interactionIcon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  videoShimmer: {
    width: SCREEN_W,
    height: SCREEN_H,
  },

  topGradient: {
    position: "absolute",
    width: SCREEN_W,
    height: fh(200),
    top: 0,
  },

  titleContainer: {
    position: "absolute",
    bottom: fh(120),
    left: fw(16),
    right: fw(16),
  },

  titleLine1: {
    width: fw(240),
    height: fh(18),
    borderRadius: fh(4),
    marginBottom: fh(8),
  },

  titleLine2: {
    width: fw(180),
    height: fh(16),
    borderRadius: fh(4),
  },

  bottomContainer: {
    position: "absolute",
    bottom: fh(40),
    right: fw(20),
    flexDirection: "column",
    alignItems: "center",
    gap: fh(18),
  },

  interactionIcon: {
    width: fw(40),
    height: fw(40),
    borderRadius: fw(20),
  },
});
