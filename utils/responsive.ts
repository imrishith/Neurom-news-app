// utils/responsive.ts
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ✅ Responsive width
export const fw = (size: number) => wp((size / SCREEN_WIDTH) * 100 + '%');

// ✅ Responsive height
export const fh = (size: number) => hp((size / SCREEN_HEIGHT) * 100 + '%');

// ✅ Responsive font
export const ff = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(newSize);
};

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

// ✅ Export screen dimensions
export const SCREEN_W = SCREEN_WIDTH;
export const SCREEN_H = SCREEN_HEIGHT;