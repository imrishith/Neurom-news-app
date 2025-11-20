// utils/layoutUtils.ts
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutChangeEvent, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import { getLayoutConfig, getLayoutConfig as getConfig } from './responsive';

let bottomBarMeasuredHeight = 60;

export const handleBottomBarLayout = (e: LayoutChangeEvent) => {
  bottomBarMeasuredHeight = e.nativeEvent.layout.height;
};

export const useBottomBarHeight = () => {
  const insets = useSafeAreaInsets();
  const config = getConfig();
  const responsiveBottomHeight = config.isTablet ? 90 : 60;
  return Math.max(bottomBarMeasuredHeight, responsiveBottomHeight) + insets.bottom;
};

// ✅ Enhanced responsive calculations
export const useResponsiveDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const config = getLayoutConfig();
  
  return {
    screenWidth: width,
    screenHeight: height,
    isLandscape: width > height,
    isTablet: config.isTablet,
    paddingHorizontal: config.contentPadding,
    maxContentWidth: config.maxContentWidth,
    headerHeight: config.headerHeight,
    cardSpacing: config.cardSpacing,
  };
};

// ✅ Get responsive container styles
export const getResponsiveContainerStyle = () => {
  const config = getLayoutConfig();
  return {
    flex: 1,
    paddingHorizontal: config.contentPadding,
    justifyContent: config.isTablet ? 'center' : 'flex-start',
    alignItems: config.isTablet ? 'center' : 'stretch',
  };
};

// ✅ Get responsive grid dimensions
export const getResponsiveGridDimensions = (columns: number = 2) => {
  const config = getLayoutConfig();
  const spacing = config.cardSpacing;
  const containerPadding = config.contentPadding;
  const availableWidth = config.screenWidth - (containerPadding * 2) - (spacing * (columns - 1));
  const itemWidth = availableWidth / columns;
  
  return {
    itemWidth: Math.floor(itemWidth),
    spacing,
    columns,
  };
};
