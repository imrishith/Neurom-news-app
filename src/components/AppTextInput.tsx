// src/components/AppTextInput.tsx
import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';

type Props = TextInputProps & {
  weight?: 'regular' | 'semibold' | 'bold' | 'medium';
};

export const AppTextInput: React.FC<Props> = ({ weight = 'regular', style, ...rest }) => {
  const { getFont } = useOnboarding();
  return (
    <TextInput
      allowFontScaling={false}
      // @ts-expect-error exists at runtime on RN host components
      maxFontSizeMultiplier={1}
      style={[{ fontFamily: getFont(weight) }, style]}
      {...rest}
    />
  );
};

export default AppTextInput;

