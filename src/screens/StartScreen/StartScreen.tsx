// screens/StartScreen/StartScreen.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import GradientScreen from "../../components/GradientScreen";
import Colors from "../../constants/colors";
import { fw, fh, ff, fr, getLayoutConfig } from "../../../utils/responsive";

const StartScreen = () => {
  const navigation = useNavigation<any>();

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Run animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Navigation is now controlled by AppNavigator, so we don't auto-navigate here
  }, []);

  return (
    <GradientScreen>
      <View style={styles.container}>
        {/* Logo */}
        <Animated.Image
          source={require("../../../assets/images/Neurom_Logo.png")}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          Loading your experience...
        </Animated.Text>
      </View>
    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getLayoutConfig().contentPadding,
    paddingVertical: fh(40),
  },
  logo: {
    width: fw(getLayoutConfig().isTablet ? 280 : 237.6),
    height: fh(getLayoutConfig().isTablet ? 80 : 66),
    marginBottom: fh(getLayoutConfig().isTablet ? 32 : 20),
  },
  subtitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16),
    fontWeight: "600",
    fontFamily: "AnekTelugu-SemiBold",
    color: Colors.textcolor,
    textAlign: "center",
    marginHorizontal: fw(8),
    lineHeight: ff(getLayoutConfig().isTablet ? 26 : 24),
    includeFontPadding: false,
  },
});

export default StartScreen;