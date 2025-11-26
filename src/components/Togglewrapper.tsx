// components/TextAudioToggle.tsx
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const TOGGLE_WIDTH = width * 0.6; // 60% of screen width
const BUTTON_WIDTH = TOGGLE_WIDTH / 2;

type Props = {
  isTextMode: boolean;
  setIsTextMode: (val: boolean) => void;
};

const TextAudioToggle = ({ isTextMode, setIsTextMode }: Props) => {
  const anim = useRef(new Animated.Value(isTextMode ? 0 : BUTTON_WIDTH)).current;

  // animate when prop changes
  useEffect(() => {
    Animated.spring(anim, {
      toValue: isTextMode ? 0 : BUTTON_WIDTH,
      useNativeDriver: false,
    }).start();
  }, [isTextMode]);

  return (
    <View style={styles.container}>
      <View style={styles.toggleBackground}>
        {/* Purple slider */}
        <Animated.View
          style={[styles.slider, { transform: [{ translateX: anim }] }]}
        />

        {/* TEXT */}
        <TouchableWithoutFeedback onPress={() => setIsTextMode(true)}>
          <View style={styles.option}>
            <Text
              style={[styles.text, isTextMode && styles.activeText]}
            >
              Text
            </Text>
          </View>
        </TouchableWithoutFeedback>

        {/* AUDIO */}
        <TouchableWithoutFeedback onPress={() => setIsTextMode(false)}>
          <View style={styles.option}>
            <Text
              style={[styles.text, !isTextMode && styles.activeText]}
            >
              Audio
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default TextAudioToggle;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBackground: {
    width: TOGGLE_WIDTH,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#eee",
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
  },
  slider: {
    position: "absolute",
    width: BUTTON_WIDTH,
    height: "100%",
    borderRadius: 25,
    backgroundColor: "#6A5AE0",
  },
  option: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
  },
  activeText: {
    color: "#fff",
    fontWeight: "600",
  },
});
