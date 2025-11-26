import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import Colors from '../constants/colors';
import { fw, fh, ff } from '../../utils/responsive';

interface ButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  backgroundColor,
  textColor,
  borderColor,
  borderWidth = 0,
  borderRadius = fw(8),
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
}) => {
  const buttonBackground = disabled
    ? Colors.mediumGray
    : backgroundColor || Colors.softGreen;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: buttonBackground,
          borderColor: borderColor || 'transparent',
          borderWidth,
          borderRadius,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textColor || Colors.white} />
      ) : (
        <>
          {iconLeft && <View style={{ marginRight: fw(8) }}>{iconLeft}</View>}
          <Text style={[styles.text, { color: "#FFF" }, textStyle]}>
            {title}
          </Text>
          {iconRight && <View style={{ marginLeft: fw(8) }}>{iconRight}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: fh(12),
    paddingHorizontal: fw(24),
    marginVertical: fh(8),
  },
  text: {
    fontSize: ff(12),
    fontWeight: '500',
    fontFamily: 'AnekTelegu-Medium',

  },
});

export default Button;
