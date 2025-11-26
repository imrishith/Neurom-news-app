// components/layout/FixedInteractionWrapper.tsx
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { fh } from "../../../utils/responsive";

interface FixedInteractionWrapperProps {
  children: React.ReactNode;
  offset?: number; // extra offset if BottomBar height changes
}

const FixedInteractionWrapper: React.FC<FixedInteractionWrapperProps> = ({
  children,
  offset = fh(60 + (Platform.OS === 'ios' ? 10 : 0))
}) => {
  return <View style={[styles.wrapper, { bottom: offset }]}>{children}</View>;
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
});

export default FixedInteractionWrapper;
