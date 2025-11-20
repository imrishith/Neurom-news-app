import React from "react";
import { View, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";

type Props = { item: any; imageHeight: number };

const BuzzImageItem: React.FC<Props> = ({ item, imageHeight }) => {
  if (!item?.mediaUrl) return null;
  return (
    <View style={[styles.imageWrapper, { height: imageHeight }]}>
      <FastImage
        source={{ uri: item.mediaUrl, priority: FastImage.priority.normal }}
        style={styles.fullscreenImage}
        resizeMode={FastImage.resizeMode.contain}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  imageWrapper: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#000",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
});

export default React.memo(BuzzImageItem);

