import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
/**
 * Dynamically chosen baselines for all modern phones.
 * No tablet / large-screen logic — purely phone-focused.
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Dynamic guideline baselines based on aspect ratio ---
let GUIDELINE_WIDTH = 360;
let GUIDELINE_HEIGHT = 780;

// Taller Android phones (Pixel / Samsung)
if (SCREEN_HEIGHT / SCREEN_WIDTH >= 2.1) {
  GUIDELINE_WIDTH = 412;   // typical Android width dp
  GUIDELINE_HEIGHT = 915;  // tall screen height dp
}
// Compact or older phones (iPhone SE, small Androids)
else if (SCREEN_HEIGHT / SCREEN_WIDTH <= 1.9) {
  GUIDELINE_WIDTH = 375;
  GUIDELINE_HEIGHT = 667;
}

type ResponsiveOptions = {
  min?: number;
  max?: number;
  round?: boolean;
};

/** Get current usable metrics every time (rotation-safe) */
const readMetrics = () => {
  const win = Dimensions.get('window');
  const scr = Dimensions.get('screen');

  // Some Androids report smaller window height (excluding nav bar)
  const baseHeight = Math.max(win.height, scr.height);
  const overlay = Math.max(0, scr.height - win.height); // nav + status combo
  const usableHeight = Math.max(0, baseHeight - overlay);

  return { width: win.width, usableHeight };
};

/** Apply min/max/round options */
const applyOptions = (value: number, options?: ResponsiveOptions) => {
  if (!options) return value;
  const { min, max, round } = options;
  let v = value;
  if (typeof min === 'number') v = Math.max(min, v);
  if (typeof max === 'number') v = Math.min(max, v);
  return round ? PixelRatio.roundToNearestPixel(v) : v;
};

/** Scale helpers */
const widthScale = () => {
  const { width } = readMetrics();
  return width / GUIDELINE_WIDTH;
};

const heightScale = () => {
  const { usableHeight } = readMetrics();
  return usableHeight / GUIDELINE_HEIGHT;
};

const uniformScale = () => Math.min(widthScale(), heightScale());

/** Density-safe rounding */
const toDp = (v: number) => PixelRatio.roundToNearestPixel(v);

/** Width scaling — proportional to actual screen width */
export const fw = (px: number, options?: ResponsiveOptions): number => {
  const scaled = px * widthScale();
  return applyOptions(toDp(scaled), options);
};

/** Height scaling — ensures no overflow / cutoff */
export const fh = (px: number, options?: ResponsiveOptions): number => {
  const { usableHeight } = readMetrics();
  const raw = px * heightScale();
  const clamped = raw < 0 ? raw : Math.min(raw, usableHeight);
  return applyOptions(toDp(clamped), options);
};

/** Font scaling — ignores system fontScale to prevent overflow */
export const ff = (px: number, options?: ResponsiveOptions): number => {
  const scaled = px * uniformScale();
  return applyOptions(toDp(scaled), options);
};

/** Moderated width-based scaling (for paddings / margins) */
export const moderateScale = (
  size: number,
  factor = 0.5,
  options?: ResponsiveOptions
): number => {
  const s = widthScale();
  const scaled = size + (size * s - size) * factor;
  return applyOptions(toDp(scaled), options);
};

/** Consistent hitSlop generator */
export const createHitSlop = (size = 8) => ({
  top: fh(size),
  bottom: fh(size),
  left: fw(size),
  right: fw(size),
});

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

export const getTopBarOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  if (Platform.OS === "ios") {
    // 🔹 Handle iPhones and iPads
    if (ratio >= 2.2) return fh(-26);  // iPhone 15 Pro Max / 14 Plus (very tall)
    if (ratio >= 2.1) return fh(-22);  // iPhone 13 / 14 / 15 standard
    if (ratio >= 2.0) return fh(-18);  // iPhone 16 Pro / compact tall
    if (ratio >= 1.8) return fh(-12);  // iPhone SE / older
    return fh(-8);                     // iPads or short screens
  } else {
    // 🔹 Android phones (existing fine-tuning)
    if (ratio >= 2.3) return fh(-18);  // ultra-tall (Pixel 9, S24 Ultra)
    if (ratio >= 2.2) return fh(-14);  // very tall (Pixel 7, S22+)
    if (ratio >= 2.1) return fh(-12);  // tall (Nord CE4, Reno 7 Pro)
    if (ratio >= 2.0) return fh(-6);   // standard 19.5:9
    if (ratio >= 1.9) return fh(-6);   // older 18:9
    return fh(-6);                     // compact screens
  }
};

export const getTopBarBottomOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  // Fine-tuned downward offset for TopBar (was bottom: fh(-5))
  if (ratio >= 2.3) return fh(-8);   // ultra-tall (Pixel 9, S24 Ultra)
  if (ratio >= 2.2) return fh(-6);   // very tall (Pixel 7, S22+)
  if (ratio >= 2.1) return fh(-5);   // tall (Oppo Reno 7 Pro, OnePlus 11)
  if (ratio >= 2.0) return fh(-4);   // standard 19.5:9
  if (ratio >= 1.9) return fh(-3);   // medium 18:9
  return fh(-2);                     // compact screens
};



export const getArticleAudioInteractionOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  // Ultra-tall (Pixel 9 / S24 Ultra)
  if (ratio >= 2.3) return fh(40);
  // Tall phones (Oppo Reno 7 Pro / OnePlus)
  if (ratio >= 2.1) return fh(40);
  // Normal Android
  if (ratio >= 1.9) return fh(30);
  // Compact / iPhone SE
  return fh(30);
};


export const getArticleTextModeOverlayOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;
  const { height: SCREEN_H } = Dimensions.get('window');

  // Clamp ratio between 1.8 and 2.3
  const minR = 1.8;
  const maxR = 2.3;
  const clamped = Math.min(maxR, Math.max(minR, ratio));

  // Linear interpolation: 1.8 → 0.25H, 2.3 → 0.32H
  const t = (clamped - minR) / (maxR - minR);
  const fraction = 0.25 + t * (0.32 - 0.25);

  return SCREEN_H * fraction;
};




export const getAudioUpcomingOffset = (): number => {
  // ✅ Use the existing constants defined above
  const ratio = SCREEN_HEIGHT / SCREEN_WIDTH;

  if (ratio >= 2.3) return fh(25); // Ultra-tall (Pixel 9, S24 Ultra)
  if (ratio >= 2.1) return fh(25); // Tall (Oppo Reno 7 Pro, OnePlus 11)
  if (ratio >= 1.9) return fh(15); // Normal Android
  return fh(15);                   // Compact (iPhone SE)
};


export const getReelVerticalOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  if (Platform.OS === "ios") {
    // 🔹 Handle iPhones
    if (ratio >= 2.2) return fh(18); // iPhone 15 Pro Max, 14 Plus, very tall
    if (ratio >= 2.1) return fh(22); // iPhone 13, 14, 15 standard
    if (ratio >= 1.9) return fh(26); // iPhone 16 Pro / compact tall
    if (ratio >= 1.7) return fh(32); // iPhone SE / older small models
    return fh(28); // fallback for unknown
  } else {
    // 🔹 Android phones (existing logic)
    if (ratio >= 2.3) return fh(28); // ultra tall
    if (ratio >= 2.2) return fh(12);
    if (ratio >= 2.1) return fh(22);
    if (ratio >= 2.0) return fh(22);
    if (ratio >= 1.9) return fh(22);
    return fh(10);
  }
};

export const getReelDescriptionOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  if (Platform.OS === "ios") {
    // 🔹 Handle iPhone & iPad families
    if (ratio >= 2.2) return fh(120);   // 15 Pro Max / 14 Plus
    if (ratio >= 2.1) return fh(165);   // 16 Pro / 16
    if (ratio >= 1.8) return fh(120);   // SE / older
    return fh(10); // iPads / fallback
  } else {
    // 🔹 Android phones (existing + refined logic)
    if (ratio >= 2.3) return fh(125); // ultra-tall (Pixel 9, S24 Ultra)
    if (ratio >= 2.1) return fh(118); // tall (OnePlus, Nord CE)
    if (ratio >= 1.9) return fh(70);  // standard 19.5:9
    return fh(70);                    // compact / small
  }
};

/**
 * Dynamic Y-offset for Reels progress bar (SliderContainer)
 */
export const getReelSliderOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  if (Platform.OS === "ios") {
    if (ratio >= 2.2) return fh(170);   // 15 Pro Max / 14 Plus
    if (ratio >= 2.1) return fh(160);   // 16 Pro / 16
    if (ratio >= 1.8) return fh(120);   // SE / older
    return fh(100);                     // iPad / fallback
  } else {
    // 🔹 Android layout tuning
    if (ratio >= 2.3) return fh(120); // ultra-tall (Pixel 9, S24 Ultra)
    if (ratio >= 2.1) return fh(118); // tall (Oppo, OnePlus)
    if (ratio >= 1.9) return fh(65);  // normal 19.5:9
    return fh(60);                    // compact phones
  }
};

export const getReelOptionsOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  if (Platform.OS === "ios") {
    // 🔹 iPhone & iPad tuning
    if (ratio >= 2.2) return fh(180); // iPhone 15 Pro Max, 14 Plus (very tall)
    if (ratio >= 2.1) return fh(190); // iPhone 13 / 14 / 15 standard
    if (ratio >= 1.9) return fh(130); // iPhone 16 Pro / compact tall
    if (ratio >= 1.7) return fh(110); // iPhone SE / older models
    return fh(100);                   // iPads / fallback
  } else {
    // 🔹 Android phones
    if (ratio >= 2.3) return fh(155); // ultra-tall (Pixel 9, S24 Ultra)
    if (ratio >= 2.1) return fh(145); // tall (Oppo Reno 7 Pro, OnePlus)
    if (ratio >= 1.9) return fh(90); // normal 19.5:9
    return fh(85);                    // compact phones
  }
};



export const getBuzzVerticalOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  // Ultra-tall (Pixel 9 / S24 Ultra)
  if (ratio >= 2.3) return fh(5);
  // Very tall (Pixel 7, S22+, Nord CE4)
  if (ratio >= 2.2) return fh(5);
  // Tall (Oppo Reno 7 Pro, OnePlus 11)
  if (ratio >= 2.1) return fh(10);
  // Standard 19.5:9
  if (ratio >= 2.0) return fh(25);
  // 18:9 phones
  if (ratio >= 1.9) return fh(25);
  // Compact / small screens
  return fh(10);
};

export const getBuzzImageOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  if (ratio >= 2.3) return fh(20);   // ultra tall (Pixel 9, S24 Ultra)
  if (ratio >= 2.1) return fh(20);   // tall phones (Oppo Reno 7 Pro, OnePlus 11)
  if (ratio >= 1.9) return fh(10);   // normal Androids
  return fh(10);                     // compact / iPhone SE
};


export const getBuzzInteractionOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  // Ultra-tall (Pixel 9 / S24 Ultra)
  if (ratio >= 2.3) return fh(110);
  // Tall phones (Oppo Reno 7 Pro / OnePlus)
  if (ratio >= 2.1) return fh(80);
  // Normal Android
  if (ratio >= 1.9) return fh(30);
  // Compact / iPhone SE
  return fh(30);
};


export const getMagazinesInteractionOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  // Ultra-tall (Pixel 9 / S24 Ultra)
  if (ratio >= 2.3) return fh(60);
  // Tall phones (Oppo Reno 7 Pro / OnePlus)
  if (ratio >= 2.1) return fh(60);
  // Normal Android
  if (ratio >= 1.9) return fh(10);
  // Compact / iPhone SE
  return fh(10);
};

/**
 * Dynamic Y-offset for Reels progress bar (SliderContainer)
 */
export const getWrapSliderOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;

  if (Platform.OS === "ios") {
    if (ratio >= 2.2) return fh(110);   // 15 Pro Max / 14 Plus
    if (ratio >= 2.1) return fh(100);   // 16 Pro / 16
    if (ratio >= 1.8) return fh(60);   // SE / older
    return fh(100);                     // iPad / fallback
  } else {
    // 🔹 Android layout tuning
    if (ratio >= 2.3) return fh(90); // ultra-tall (Pixel 9, S24 Ultra)
    if (ratio >= 2.1) return fh(80); // tall (Oppo, OnePlus)
    if (ratio >= 1.9) return fh(30);  // normal 19.5:9
    return fh(60);                    // compact phones
  }
};

export const getBuzzSliderOffset = (): number => {
  const { width, usableHeight } = readMetrics();
  const ratio = usableHeight / width;
  if (ratio >= 2.1) return fh(-5);   // tall screens
  if (ratio >= 2.0) return fh(-85);   // standard 19.5:9
  if (ratio >= 1.9) return fh(-62);   // older 18:9
  return fh(58);                     // compact / iPhones
};
