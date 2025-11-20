// src/constants/layout.ts
import { fh } from "../../utils/responsive";
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

/**
 * Global layout constants to ensure consistent sizing across all screens.
 * Keep these in sync with your actual BottomBar height & TopBar height.
 */
export const TOPBAR_HEIGHT_PERCENT = 3;  // 7% of screen height
export const BOTTOMBAR_HEIGHT_PERCENT = 3; // 8% of screen height

export const TOPBAR_HEIGHT = hp(`${TOPBAR_HEIGHT_PERCENT}%`);
export const BOTTOMBAR_HEIGHT = hp(`${BOTTOMBAR_HEIGHT_PERCENT}%`);

// ✅ Calculate available content height
export const CONTENT_HEIGHT_PERCENT = 100 - TOPBAR_HEIGHT_PERCENT - BOTTOMBAR_HEIGHT_PERCENT;
export const CONTENT_HEIGHT = hp(`${CONTENT_HEIGHT_PERCENT}%`);
