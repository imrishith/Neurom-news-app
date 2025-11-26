// src/components/GradientScreen.tsx
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';


interface Props {
  children: ReactNode;
}

const GradientScreen = ({ children }: Props) => {
  const { Colors, theme, toggleTheme, setTheme } = useTheme();

  return (
    <LinearGradient
      colors={Colors.gradientPrimary.colors}
      start={Colors.gradientPrimary.direction.start}
      end={Colors.gradientPrimary.direction.end}
      style={styles.container}
    >
    {/* // <View> */}
      {children}
      {/* </View> */}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default GradientScreen;
