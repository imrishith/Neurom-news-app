import React, { useState, useMemo, useEffect } from "react";
import {
  Image,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
  FlatList,
} from "react-native";

import HeroSnapCarousel, {
  HeroItem,
} from "../../../components/HeroSnapCarousel/HeroSnapCarousel";

import { fw, fh, ff } from "../../../../utils/responsive";
import Colors from "../../../constants/colors";
import { useNavigation } from "@react-navigation/native";
import { useOnboarding } from "../../../context/OnboardingContext";

import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";
import { timeAgo } from "../../../../utils/timeAgo";
import { getStateArticles } from "../../../../src/api/users/contentApi";

const TrendingHeroCarousel = ({ onPress }) => {
  const navigation = useNavigation<any>();
  const { t, getFont, getLangCode } = useOnboarding();

  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // ---------------------------------------------
  // FETCH TRENDING NEWS (LOCAL STATE ONLY)
  // ---------------------------------------------
  useEffect(() => {
    const loadTrending = async () => {
      try {
        setLoading(true);

        const res = await getStateArticles(
          undefined,   // cursor
          undefined,   // category
          undefined,   // is_breaking
          true,        // is_trending
          undefined    // is_exclusive
        );

        if (res?.success && Array.isArray(res.data?.items)) {
          setTrending(res.data.items);
        }
      } catch (err) {
        console.log("❌ Trending Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTrending();
  }, []);

  // ---------------------------------------------
  // MAP TO CAROUSEL DATA
  // ---------------------------------------------
  const trendingArticles: HeroItem[] = useMemo(() => {
    const isTelugu = getLangCode() === "te";

    return trending.map((a) => ({
      id: a.article_id,
      image:
        a.media?.type === "video"
          ? { uri: a.media.thumbnail }
          : a.media?.url
            ? { uri: a.media.url }
            : require("../../../../assets/images/factory.png"),
      title: isTelugu ? a.title_te : a.title_en,
      createdAt: a.created_at,
      views: a.stats?.views_count ?? 0,
      payload: { type: "article", data: a },
    }));
  }, [trending, getLangCode]);

  // ---------------------------------------------
  // SHIMMER
  // ---------------------------------------------
  const shimmerData = [1, 2, 3, 4];

  const renderShimmerItem = () => (
    <View style={styles.shimmerCard}>
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.shimmerImage}
      />
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.shimmerTitle}
      />
    </View>
  );

  if (loading && trending.length === 0) {
    return (
      <View style={styles.shimmerWrapper}>
        <FlatList
          horizontal
          data={shimmerData}
          keyExtractor={(i) => `trending-shimmer-${i}`}
          renderItem={renderShimmerItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shimmerList}
        />
      </View>
    );
  }

  if (trendingArticles.length === 0) return null;

  return (
    <View>
      <HeroSnapCarousel
        data={trendingArticles}
        onSnapToItem={(i) => setActiveIndex(i)}
        aspectRatio={1.6}
        cardWidthPct={0.9}
        gap={0.1}
        showMetaChip={true}
        renderTopRight={(item) => (
          <View style={styles.topRightInfo}>
            <Text style={[styles.location, { fontFamily: getFont("semibold") }]}>
              Hyderabad
            </Text>
            <Text style={[styles.timeAgo, { fontFamily: getFont("semibold") }]}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
        )}
        renderTitle={(item) => (
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[styles.titleText, { fontFamily: getFont("semibold") }]}
          >
            {item.title}
          </Text>
        )}
        renderRight={(item) => (
          <TouchableOpacity
            style={styles.listenNowButton}
            onPress={() => {
              const articleData = item.payload.data;

              navigation.navigate("ArticleScreen", {
                articleId: articleData.article_id,
                fromTrending: true,
                mode: "audio",
              });
            }}
          >
            <Text style={styles.listenNowText}>{t("audio")}</Text>

            <View style={styles.listenNowIconWrap}>
              <Image
                source={require("../../../../assets/icons/wave.png")}
                style={{ width: fw(10), height: fh(10), tintColor: "#fff" }}
              />
            </View>
          </TouchableOpacity>
        )}
        onPressItem={(item) => {
          const article = item.payload.data;

          navigation.navigate("ArticleScreen", {
            articleId: article.article_id,
            fromTrending: true,
          });
        }}
      />

      {/* Dots */}
      <View style={styles.paginationContainer}>
        {trendingArticles.map((_, i) => (
          <View key={i} style={[styles.dot, activeIndex === i && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
};

export default TrendingHeroCarousel;

// ---------------------------------------------
// STYLES
// ---------------------------------------------
const styles = StyleSheet.create({
  topRightInfo: {
    flexDirection: "row",
    paddingHorizontal: fw(10),
    paddingVertical: fh(6),
  },
  location: { color: Colors.textcolor, fontSize: ff(12) },
  timeAgo: { color: Colors.textcolor, fontSize: ff(12), marginLeft: fw(4) },

  titleText: {
    fontSize: ff(14),
    color: Colors.textcolor,
    marginTop: fh(8),
    paddingHorizontal: fw(12),
    width: fw(280),
    lineHeight: Platform.OS === "ios" ? ff(35) : ff(22),
  },

  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: fh(8),
  },
  dot: {
    width: fw(8),
    height: fw(8),
    borderRadius: fw(4),
    backgroundColor: Colors.textcolor,
    marginHorizontal: fw(4),
  },
  activeDot: {
    backgroundColor: "#997DDF",
    width: fw(20),
    height: fh(8),
    borderRadius: fw(10),
  },

  listenNowButton: {
    backgroundColor: "#fff",
    borderRadius: fw(20),
    width: fw(70),
    height: fh(22),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: fh(-80),
    marginRight: fw(-8),
  },
  listenNowText: {
    color: "#000",
    fontSize: ff(12),
    paddingRight: fw(18),
  },
  listenNowIconWrap: {
    position: "absolute",
    right: fw(-2),
    top: "-10%",
    width: fw(25),
    height: fh(25),
    borderRadius: fw(20),
    backgroundColor: "#836AD9",
    justifyContent: "center",
    alignItems: "center",
  },

  shimmerWrapper: { paddingVertical: fh(30) },
  shimmerList: { paddingHorizontal: fw(16) },

  shimmerCard: {
    width: fw(280),
    height: fh(160),
    backgroundColor: "#1f1f1f",
    borderRadius: fw(14),
    marginRight: fw(12),
    padding: fw(10),
  },
  shimmerImage: {
    width: "100%",
    height: "80%",
    borderRadius: fw(12),
  },
  shimmerTitle: {
    width: "65%",
    height: "20%",
    borderRadius: fw(8),
  },
});