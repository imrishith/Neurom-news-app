// components/BottomToast.tsx
import React, { useEffect, useState } from "react";
import { Animated, Text, StyleSheet } from "react-native";

export const BottomToast = ({ message, visible }: { message: string; visible: boolean }) => {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  text: { color: "#fff" },
});
