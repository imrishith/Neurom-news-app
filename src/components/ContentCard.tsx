import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import PdfPagerViewer from "../screens/DailyWraps/PdfPageViewer";

interface FeedItem {
  id: string;
  type: "image" | "pdf";
  url: string;
}

interface Props {
  item: FeedItem;
  verticalPagerRef: React.RefObject<any>;
}

const ContentCard: React.FC<Props> = ({ item, verticalPagerRef }) => {
  if (item.type === "image") {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: item.url }}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.typeText}>IMAGE</Text>
      </View>
    );
  }

 if (item.type === "pdf") {
  return (
    <PdfPagerViewer
      url={item.url}
      onSwipeStart={() => verticalPagerRef.current?.setScrollEnabled(false)}
      onSwipeEnd={() => verticalPagerRef.current?.setScrollEnabled(true)}
    />
  );
}

  return (
    <View style={styles.container}>
      <Text style={styles.typeText}>Unsupported</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { ...StyleSheet.absoluteFillObject },
  typeText: {
    fontSize: 24,
    color: "white",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
  },
});

export default ContentCard;
