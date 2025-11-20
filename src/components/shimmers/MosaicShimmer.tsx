import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { fw, fh } from "../../../utils/responsive";

const Shimmer = createShimmerPlaceholder(LinearGradient);

const { width } = Dimensions.get("window");
const PAD_H = fw(16);
const GAP = fw(10);
const contentW = width - PAD_H * 2;
const colW = (contentW - GAP) / 2;

// Different card heights (same as your real cards)
const heights = [fh(180), fh(220), fh(260), fh(200), fh(240), fh(280)];

const MosaicShimmer = () => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* LEFT COLUMN */}
        <View style={{ width: colW }}>
          {heights.map((h, i) => (
            <Shimmer key={`L-${i}`} style={[styles.card, { width: colW, height: h }]} />
          ))}
        </View>

        {/* RIGHT COLUMN */}
        <View style={{ width: colW }}>
          {heights.map((h, i) => (
            <Shimmer key={`R-${i}`} style={[styles.card, { width: colW, height: h }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

export default MosaicShimmer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: PAD_H,
    paddingTop: fh(18),
  },
  row: {
    flexDirection: "row",
    gap: GAP,
  },
  card: {
    borderRadius: fw(10),
    marginBottom: GAP,
  },
});
