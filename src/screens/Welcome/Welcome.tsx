import React, { useEffect } from "react";
import { View, StyleSheet, Image, Animated } from "react-native";
import GradientScreen from "../../components/GradientScreen";
import { fw, fh, ff, fr, getLayoutConfig } from "../../../utils/responsive";
import Colors from "../../constants/colors";
import { useNavigation } from "@react-navigation/native";

const SplashScreen = () => {
  const navigation = useNavigation<any>();
  const fadeAnim = new Animated.Value(0); // initial opacity
  const scaleAnim = new Animated.Value(0.5); // initial scale

  useEffect(() => {
    // Animate fade + scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate after 3s
    const timer = setTimeout(() => {
      navigation.replace("HomeScreen"); // 👈 update with your actual first screen
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <GradientScreen>
      <View style={styles.container}>
        <Animated.Image
          source={require("../../../assets/images/logo.png")}
          style={[
            styles.logo,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          resizeMode="contain"
        />
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
  },
});

export default SplashScreen;
