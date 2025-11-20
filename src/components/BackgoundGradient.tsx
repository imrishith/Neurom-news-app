// components/GradientScreen.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const GradientScreen = ({ children }) => {
  const { Colors } = useTheme(); // ✅ dynamic theme

  return (
    <LinearGradient
      colors={Colors.gradientSecondary.colors}
      start={Colors.gradientSecondary.direction.start}
      end={Colors.gradientSecondary.direction.end}
      style={styles.container}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientScreen;
