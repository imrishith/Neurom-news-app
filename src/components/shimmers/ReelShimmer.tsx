import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";

const Shimmer = createShimmerPlaceholder(LinearGradient);

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const ReelShimmer = () => {
  return (
    <View style={styles.container}>
      {/* Fullscreen shimmering video placeholder */}
      <Shimmer style={styles.bg} />

      {/* Bottom text area */}
      <View style={styles.bottomArea}>
        <Shimmer style={styles.chip} />
        <Shimmer style={styles.title} />
        <Shimmer style={styles.desc} />
      </View>

      {/* Right-side icons */}
      <View style={styles.sideOptions}>
        <Shimmer style={styles.sideIcon} />
        <Shimmer style={styles.sideIcon} />
        <Shimmer style={styles.sideIcon} />
      </View>
    </View>
  );
};

export default ReelShimmer;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  bg: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  bottomArea: {
    position: "absolute",
    left: 20,
    bottom: 80,
    width: SCREEN_W * 0.55,
  },
  chip: {
    width: 90,
    height: 22,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    width: "90%",
    height: 20,
    borderRadius: 6,
    marginBottom: 8,
  },
  desc: {
    width: "70%",
    height: 16,
    borderRadius: 6,
  },
  sideOptions: {
    position: "absolute",
    right: 20,
    bottom: 80,
    alignItems: "center",
  },
  sideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginVertical: 10,
  },
});
