import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { fw, fh, ff } from "../../../utils/responsive";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";

interface UpcomingArticlesCarouselProps {
  articles: any[];
  currentIndex: number;
  isTelugu: boolean;
  onSelect: (article: any, index: number) => void;
}

const UpcomingArticlesCarousel = ({
  articles,
  currentIndex,
  isTelugu,
  onSelect,
}: UpcomingArticlesCarouselProps) => {
  const { Colors } = useTheme();
  const { getLangCode, getFont } = useOnboarding();

  // ✅ Use centralized language detection

  // Take only next articles after currentIndex
  const upcoming = articles.slice(currentIndex + 1);

  if (upcoming.length === 0) return null;

  const renderCard = ({ item, index }: any) => {
    const title = isTelugu ? item.title_te : item.title_en;

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: Colors.mediumGray }]}
        onPress={() => onSelect(item, currentIndex + 1 + index)}
      >
        {item?.media?.type === "video" ? (
          <Image
            source={{ uri: item.media?.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
            resizeMethod="resize"
            fadeDuration={0}
          />
        ) : item?.media?.url ? (
          <Image
            source={{ uri: item.media.url }}
            style={styles.thumbnail}
            resizeMode="cover"
            resizeMethod="resize"
            fadeDuration={0}
          />
        ) : (
          <Image
            source={require("../../../assets/images/factory.png")}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}




        {/* <Image
          source={require("../../../assets/icons/wave.png")}
          style={styles.audioIcon}
        /> */}

        <View style={styles.textWrapper}>

          <LinearGradient
            colors={[
              "rgba(0,0,0,0.9)",  // bottom – darkest
              "rgba(0,0,0,0.6)",  // middle
              "rgba(0,0,0,0.0)",  // top – fully transparent
            ]}
            locations={[0, 0.4, 1]}           // fade stops
            start={{ x: 0.5, y: 1 }}          // bottom
            end={{ x: 0.5, y: 0 }}            // top
            style={styles.overlay}
          />

          <Text
            numberOfLines={2}
            style={[styles.title, { fontFamily: getFont("medium") }]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      horizontal
      data={upcoming}
      renderItem={renderCard}
      keyExtractor={(item, idx) => `upcoming-${item.article_id}-${idx}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      snapToInterval={fw(140)}
      decelerationRate="fast"
      nestedScrollEnabled
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: fw(20),
    marginTop: fh(10),
  },
  card: {
    width: fw(120),
    height: fh(160),
    borderRadius: fw(12),
    overflow: "hidden",
    marginRight: fw(12),
    position: "relative",
    borderWidth: 1,
  },
  thumbnail: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject },
  audioIcon: {
    position: "absolute",
    top: "40%",
    left: "40%",
    width: fw(30),
    height: fw(20),
    resizeMode: "contain",
    tintColor: "#fff",
  },
  textWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: fh(6),

  },
  title: {
    fontSize: ff(12),
    fontWeight: "700",
    textAlign: "left",
    color: "#fff",
  },
});

export default UpcomingArticlesCarousel;
