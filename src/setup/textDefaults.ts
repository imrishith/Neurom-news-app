// src/setup/textDefaults.ts
// Apply global defaults to make text ignore system font scaling
// and enforce app-defined font families.

import { Text, TextInput, TextProps, TextStyle } from 'react-native';
import { Fonts } from '../../utils/typography';

type HostComponentWithDefaults = typeof Text & { defaultProps?: Partial<TextProps> };

const setTextDefaults = () => {
  const DefaultFontFamily: NonNullable<TextStyle['fontFamily']> = Fonts.inter.regular;

  // Text
  const TextComp = Text as unknown as HostComponentWithDefaults;
  TextComp.defaultProps = TextComp.defaultProps ?? {};
  TextComp.defaultProps.allowFontScaling = false;
  // Extra safety: prevent any multiplier from system settings
  // @ts-expect-error RN host prop exists at runtime
  TextComp.defaultProps.maxFontSizeMultiplier = 1;
  // Merge any existing default style with our enforced fontFamily
  const existingTextStyle = (TextComp.defaultProps.style ?? []) as TextStyle | TextStyle[];
  TextComp.defaultProps.style = [existingTextStyle as any, { fontFamily: DefaultFontFamily }];

  // TextInput
  const TIComp = TextInput as unknown as HostComponentWithDefaults;
  TIComp.defaultProps = TIComp.defaultProps ?? {};
  TIComp.defaultProps.allowFontScaling = false;
  // @ts-expect-error RN host prop exists at runtime
  TIComp.defaultProps.maxFontSizeMultiplier = 1;
  const existingTIStyle = (TIComp.defaultProps.style ?? []) as TextStyle | TextStyle[];
  TIComp.defaultProps.style = [existingTIStyle as any, { fontFamily: DefaultFontFamily }];
};

// Execute immediately on import
setTextDefaults();

export {};

