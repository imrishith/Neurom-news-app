import React from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { TouchableOpacity } from "react-native-gesture-handler";

interface ToggleProps {
  isTextMode: boolean;
  onToggle: (val: boolean) => void;
}

export default function TextAudioToggle({ isTextMode, onToggle }: ToggleProps) {
  const knobX = useSharedValue(isTextMode ? 0 : 1);

  // Animate knob position when isTextMode changes
  const knobStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withTiming(knobX.value * 60) }],
    };
  }, []);

  React.useEffect(() => {
    knobX.value = isTextMode ? 0 : 1;
  }, [isTextMode]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.container, isTextMode ? styles.textBg : styles.audioBg]}
      onPress={() => onToggle(!isTextMode)} // 👈 trigger toggle
    >
      <Animated.View style={[styles.knob, knobStyle]} />
      <Text style={[styles.label, isTextMode ? styles.active : styles.inactive]}>
        Text
      </Text>
      <Text style={[styles.label, !isTextMode ? styles.active : styles.inactive]}>
        Audio
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: 140,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  knob: {
    position: "absolute",
    width: 70,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },
  label: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    zIndex: 2,
  },
  active: { color: "#000" },
  inactive: { color: "#888" },
  textBg: { backgroundColor: "#B0E0E6" },
  audioBg: { backgroundColor: "#DDA0DD" },
});
