// utils/responsive.ts
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for scaling (iPhone 12 Pro standard)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// ✅ Enhanced Responsive width with better scaling
export const fw = (size: number) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const scaledSize = size * Math.max(0.8, Math.min(1.3, scale)); // Cap scaling between 80% and 130%
  return wp((scaledSize / BASE_WIDTH) * 100 + '%');
};

// ✅ Enhanced Responsive height with better scaling
export const fh = (size: number) => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const scaledSize = size * Math.max(0.8, Math.min(1.2, scale)); // Cap scaling between 80% and 120%
  return hp((scaledSize / BASE_HEIGHT) * 100 + '%');
};

// ✅ Smart Responsive font that adapts to screen size
export const ff = (size: number) => {
  const widthScale = SCREEN_WIDTH / BASE_WIDTH;
  const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;
  const avgScale = (widthScale + heightScale) / 2;
  
  // Cap font scaling to prevent overly small/large text
  const finalScale = Math.max(0.85, Math.min(1.4, avgScale));
  const newSize = size * finalScale;
  
  // Round to nearest 0.5 for better visual consistency
  return Math.round(newSize * 2) / 2;
};

// ✅ Spacing that adapts to screen size
export const fs = (size: number) => fw(size); // Same as fw but semantic meaning

// ✅ Responsive padding/margin
export const fp = (size: number) => fw(size);

// ✅ Border radius that scales appropriately
export const fr = (size: number) => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  return size * Math.max(0.7, Math.min(1.5, scale));
};

// ✅ Get safe area dimensions
export const getSafeAreaDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return {
    width,
    height,
    statusBarHeight: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    safeAreaInsets: {
      top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
      bottom: 0, // Will be provided by safe area context
      left: 0,
      right: 0,
    }
  };
};

// ✅ Enhanced TopInset calculation for all device types
export const getTopInset = (): number => {
  const { height, width } = Dimensions.get('window');
  const ratio = height / width;

  // Typical status bar height (RN doesn't always report correctly)
  const STATUS_BAR = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

  // TopBarContainer average height (roughly 45–55dp)
  const TOPBAR_HEIGHT =
    ratio >= 2.15
      ? 15 // ultra-tall (Pixel 9, Galaxy S24+, 20:9+)
      : ratio >= 2.2
      ? 20 // very tall (Pixel 7, S22+, Nord CE4)
      : ratio >= 2.1
      ? 29 // tall modern (Reno 7, OnePlus 11)
      : ratio >= 2.0
      ? 28 // standard tall (most 19.5:9)
      : ratio >= 1.9
      ? 26 // medium (older iPhones / 18:9)
      : 22; // short screens or tablets

  return STATUS_BAR + TOPBAR_HEIGHT; // ✅ total top inset
};

// ✅ Get optimal layout dimensions for different components
export const getLayoutConfig = () => {
  const { width, height } = Dimensions.get('window');
  const isTablet = width >= 768;
  const isLandscape = width > height;
  
  return {
    isTablet,
    isLandscape,
    contentPadding: isTablet ? fw(40) : fw(20),
    maxContentWidth: isTablet ? fw(600) : fw(width),
    headerHeight: fh(60),
    bottomTabHeight: fh(80),
    cardSpacing: fw(16),
    textScale: Math.min(width / BASE_WIDTH, height / BASE_HEIGHT),
  };
};

// ✅ Export screen dimensions
export const SCREEN_W = SCREEN_WIDTH;
export const SCREEN_H = SCREEN_HEIGHT;

// ✅ Device type detection
export const isTabletDevice = () => SCREEN_WIDTH >= 768;
export const isLandscapeMode = () => SCREEN_WIDTH > SCREEN_HEIGHT;
export const isSmallDevice = () => SCREEN_HEIGHT < 700;

// ✅ Quick responsive helper for consistent styling
export const getResponsiveValue = (phoneValue: number, tabletValue: number) => {
  const config = getLayoutConfig();
  return config.isTablet ? tabletValue : phoneValue;
};

// ✅ Get responsive container styles
export const getResponsiveContainer = () => {
  const config = getLayoutConfig();
  return {
    flex: 1,
    paddingHorizontal: config.contentPadding,
    justifyContent: config.isTablet ? 'center' : 'flex-start',
    alignItems: config.isTablet ? 'center' : 'stretch',
  };
};

// ✅ Responsive spacing values
export const spacing = {
  xs: fw(4),
  sm: fw(8),
  md: fw(16),
  lg: fw(24),
  xl: fw(32),
  xxl: fw(40),
};

// ✅ Responsive text sizes
export const textSize = {
  xs: ff(12),
  sm: ff(14),
  md: ff(16),
  lg: ff(18),
  xl: ff(20),
  xxl: ff(24),
};