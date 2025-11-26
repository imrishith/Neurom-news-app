// utils/layoutUtils.ts
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutChangeEvent } from "react-native";
import { useState, useEffect } from "react";

let bottomBarMeasuredHeight = 60;

export const handleBottomBarLayout = (e: LayoutChangeEvent) => {
  bottomBarMeasuredHeight = e.nativeEvent.layout.height;
};

export const useBottomBarHeight = () => {
  const insets = useSafeAreaInsets();
  return bottomBarMeasuredHeight + insets.bottom;
};
