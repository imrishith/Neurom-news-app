import React, { useEffect, useState } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";

const LivePulse = () => {
  const pulseAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const animatedScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const animatedOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.wrapper}>
      {/* Outer pulsing ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: animatedScale }],
            opacity: animatedOpacity,
          },
        ]}
      />
      {/* Inner solid red circle */}
      <View style={styles.innerDot} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30", // alert red
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
  },
});

export default LivePulse;
