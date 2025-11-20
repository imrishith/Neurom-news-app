import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { fw, ff } from '../../utils/responsive';
import { useTheme } from '../context/ThemeContext'; // ✅ import theme
import { useOnboarding } from "../context/OnboardingContext";


interface CircleProps {
  size?: number;
  backgroundColor?: string;
  gradientColors?: string[];
  imageUrl?: string | number;   // ✅ support require() numbers too
  icon?: React.ReactNode;
  letter?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  imageStyle?: ImageStyle;
  borderColor?: string;
  borderWidth?: number;
  shadow?: boolean;
  tintIcon?: boolean; // ✅ optional override
}

const Circle: React.FC<CircleProps> = ({
  size = 60,
  backgroundColor = '#ddd',
  gradientColors,
  imageUrl,
  icon,
  letter,
  style,
  textStyle,
  imageStyle,
  borderColor,
  borderWidth = 0,
  shadow = false,
  tintIcon = true, // ✅ default: tint icons to theme color
}) => {
  const { Colors } = useTheme(); // ✅ theme colors
  const responsiveSize = fw(size);
  const innerImageSize = fw(size - 8);
  const fontSize = ff(size / 2.5);
  const { getFont } = useOnboarding();
  const CircleContent = () => (
    <>
      {imageUrl ? (
        <Image
          source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl}
          style={[
            {
              width: innerImageSize,
              height: innerImageSize,
              borderRadius: innerImageSize / 2,
              // ✅ tint icon if enabled
              tintColor: tintIcon ? Colors.icon: undefined,
              resizeMode: 'contain',
            },
            imageStyle,
          ]}
        />
      ) : icon ? (
        icon
      ) : letter ? (
        <Text
          style={[
            {
              fontSize,
              color: Colors.textcolor, // ✅ theme aware text
              fontFamily: getFont("regular"),
              textAlign: 'center',
              textAlignVertical: 'center',
              includeFontPadding: false,
              lineHeight: fontSize * 1.3,
            },
            textStyle,
          ]}
        >
          {letter}
        </Text>
      ) : null}
    </>
  );

  return gradientColors ? (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: responsiveSize,
          height: responsiveSize,
          borderRadius: responsiveSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
          borderColor: borderColor || 'transparent',
          borderWidth,
        },
        shadow && styles.shadow,
        style,
      ]}
    >
      <CircleContent />
    </LinearGradient>
  ) : (
    <View
      style={[
        {
          width: responsiveSize,
          height: responsiveSize,
          borderRadius: responsiveSize / 2,
          backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderColor: borderColor || 'transparent',
          borderWidth,
        },
        shadow && styles.shadow,
        style,
      ]}
    >
      <CircleContent />
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});

export default Circle;
