// src/components/AppText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';

export type FontWeightKey = 'regular' | 'semibold' | 'bold' | 'medium';

type Props = TextProps & {
  weight?: FontWeightKey;
};

export const AppText: React.FC<Props> = ({ weight = 'regular', style, ...rest }) => {
  const { getFont } = useOnboarding();
  return (
    <Text
      // Make sure per-component still ignores system scaling
      allowFontScaling={false}
      // @ts-expect-error exists at runtime on RN host components
      maxFontSizeMultiplier={1}
      style={[{ fontFamily: getFont(weight) }, style]}
      {...rest}
    />
  );
};

export default AppText;

