import React, { useState } from "react";
import { View, FlatList, Text, StyleSheet, Dimensions } from "react-native";
import FastImage from "react-native-fast-image";
import { fw, fh } from "../../../../utils/responsive";

const { width: SCREEN_W } = Dimensions.get("window");

type Props = { item: any; isActive: boolean };

const BuzzMagazineItem: React.FC<Props> = ({ item }) => {
  const [idx, setIdx] = useState(0);
  const pages = item.pages || [];

  if (!pages || pages.length === 0) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>Pages not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.slide}>
      <FlatList
        data={pages}
        keyExtractor={(p) => String(p.page_number)}
        renderItem={({ item: p }) => (
          <View style={styles.slide}>
            <FastImage source={{ uri: p.url }} style={styles.fullscreenImage} resizeMode={FastImage.resizeMode.contain} />
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setIdx(i);
        }}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
      />
      <View style={{ position: "absolute", left: fw(16), right: fw(16), bottom: fh(24) }}>
        <Text style={{ color: "#fff", marginTop: fh(4) }}>Page {idx + 1} / {pages.length}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: { width: SCREEN_W, height: "100%", position: "relative" },
  fullscreenImage: { width: SCREEN_W, height: "100%" },
  errorBox: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: fw(20),
  },
  errorText: { color: "#fff", fontSize: 16, textAlign: "center" },
});

export default React.memo(BuzzMagazineItem);

