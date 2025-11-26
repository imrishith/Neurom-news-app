// AppLayout.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom components
import TopBar from "../src/components/TopBar";
import BottomBar from "../src/components/Bottombar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Fixed TopBar */}
      <TopBar />

      {/* ✅ Screen content goes here */}
      <View style={styles.content}>{children}</View>

      {/* ✅ Fixed BottomBar */}
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1 },
});
