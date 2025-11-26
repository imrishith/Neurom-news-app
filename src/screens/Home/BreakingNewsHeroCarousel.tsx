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
} from "../../components/HeroSnapCarousel/HeroSnapCarousel";

import { fw, fh, ff } from "../../../utils/responsive";
import Colors from "../../constants/colors";
import { timeAgo } from "../../../utils/timeAgo";
import { useNavigation } from "@react-navigation/native";
import { useOnboarding } from "../../context/OnboardingContext";

import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";

import { getStateArticles } from "../../../src/api/users/contentApi";

const TopRightInfo = ({
  location,
  timeAgo,
  getFont,
}: {
  location: string;
  timeAgo: string;
  getFont: (w: string) => string;
}) => (
  <View style={styles.topRightContainer}>
    <Text style={[styles.topRightText, { fontFamily: getFont("semibold") }]}>
      {location}
    </Text>
    <Text
      style={[
        styles.topRightText,
        styles.timeAgoText,
        { fontFamily: getFont("semibold") },
      ]}
    >
      {timeAgo}
    </Text>
  </View>
);

interface BreakingNewsHeroCarouselProps {
  onPress?: () => void;
}

export default function BreakingNewsHeroCarousel({
  onPress,
}: BreakingNewsHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [breaking, setBreaking] = useState([]);

  const navigation = useNavigation<any>();
  const { t, getFont, getLangCode } = useOnboarding();

  // -----------------------------
  // FETCH BREAKING NEWS ONLY ONCE
  // -----------------------------
  useEffect(() => {
    const loadBreaking = async () => {
      try {
        setLoading(true);

        const res = await getStateArticles(
          undefined, // cursor
          undefined, // category
          true, // is_breaking
          undefined, // is_trending
          undefined // is_exclusive
        );

        if (res?.success && Array.isArray(res.data?.items)) {
          setBreaking(res.data.items);
        }
      } catch (err) {
        console.log("❌ Breaking News Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBreaking();
  }, []);

  // -----------------------------
  // MAP BREAKING ARTICLES
  // -----------------------------
  const breakingArticles: HeroItem[] = useMemo(() => {
    const lang = getLangCode();
    const isTelugu = lang === "te";

    return breaking.map((a: any) => ({
      id: a.article_id,
      image:
        a.media?.type === "video"
          ? { uri: a.media?.thumbnail }
          : a.media?.url
            ? { uri: a.media?.url }
            : require("../../../assets/images/factory.png"),
      title: isTelugu ? a.title_te : a.title_en,
      subtitle: isTelugu
        ? a.Category?.name_te || a.Category?.name_en
        : a.Category?.name_en,
      metaText: "Breaking",
      payload: { type: "article", id: a.article_id, data: a },
      createdAt: a.created_at,
    }));
  }, [breaking, getLangCode()]);


  // -----------------------------
  // SHIMMER DISPLAY
  // -----------------------------
  const shimmerData = useMemo(() => [1, 2, 3, 4], []);

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

  if (loading && breaking.length === 0) {
    return (
      <View style={styles.shimmerWrapper}>
        <FlatList
          horizontal
          data={shimmerData}
          keyExtractor={(i) => `breaking-shimmer-${i}`}
          renderItem={renderShimmerItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shimmerList}
        />
      </View>
    );
  }

  if (breakingArticles.length === 0) return null;

  return (
    <View>
      <HeroSnapCarousel
        data={breakingArticles}
        onSnapToItem={(i: number) => setActiveIndex(i)}
        cardWidthPct={0.9}
        aspectRatio={1.6}
        gap={0.1}
        peekMultiplier={1}
        showMetaChip={true}
        onPressItem={(item) => {
          if (onPress) {
            onPress(item);  // 🔥 pass full item
            return;
          }

          navigation.navigate("ArticleScreen", {
            articleId: item.payload?.id,
            fromBreaking: true,
          });
        }}
        renderRight={(item) => (
          <TouchableOpacity
            style={styles.listenNowButton}
            onPress={() => {
              const articleData = item.payload.data;

              navigation.navigate("ArticleScreen", {
                articleId: articleData.article_id,
                fromBreaking: true,
                mode: "audio",
              });
            }}
            activeOpacity={0.8}
          >
            <View style={styles.listenNowContent}>
              <Text
                style={[
                  styles.listenNowText,
                  { color: "#000", fontFamily: getFont("regular") },
                ]}
              >
                {t('audio')}
              </Text>
              <View style={styles.listenNowIconWrap}>
                <View style={styles.listenNowWaves}>
                  <Image
                    source={require("../../../assets/icons/wave.png")}
                    style={{
                      width: fw(10),
                      height: fh(10),
                      tintColor: "#fff",
                    }}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        renderTopRight={(item) => (
          <TopRightInfo
            location={"Hyderabad"}
            timeAgo={timeAgo(item.createdAt)}
            getFont={getFont}
          />
        )}
        renderTitle={(item) => (
          <Text
            style={[
              styles.titleText,
              { fontFamily: getFont("semibold"), fontWeight: "700" },
            ]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
        )}
      />

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {breakingArticles.map((_, i) => (
          <View key={i} style={[styles.dot, activeIndex === i && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRightContainer: {
    paddingHorizontal: fw(10),
    paddingVertical: fh(6),
    flexDirection: "row",
    alignItems: "center",
  },
  topRightText: {
    color: Colors.textcolor,
    fontSize: ff(12),
  },
  timeAgoText: {
    marginLeft: fw(4),
  },
  titleText: {
    fontSize: ff(14),
    color: Colors.textcolor,
    paddingHorizontal: fw(12),
    marginTop: fh(8),
    lineHeight: Platform.OS === "ios" ? ff(35) : ff(22),
    width: fw(280),
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: fh(10),
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
    marginRight: fw(-8),
    marginBottom: fh(-80),
    elevation: 4,
  },
  listenNowContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  listenNowText: {
    color: "#000",
    fontSize: ff(12),
    paddingRight: fw(18),
  },
  listenNowIconWrap: {
    position: "absolute",
    right: fw(-2),
    top: "-20%",
    width: fw(25),
    height: fh(25),
    borderRadius: fw(20),
    backgroundColor: "#836AD9",
    alignItems: "center",
    justifyContent: "center",
  },
  listenNowWaves: {
    flexDirection: "row",
    gap: fw(2),
  },
  shimmerWrapper: {
    paddingVertical: fh(30),
  },
  shimmerList: {
    paddingHorizontal: fw(16),
  },
  shimmerCard: {
    width: fw(280),
    height: fh(160),
    borderRadius: fw(20),
    backgroundColor: "#1f1f1f",
    marginRight: fw(12),
    padding: fw(12),
  },
  shimmerImage: {
    width: "100%",
    height: fh(120),
    borderRadius: fw(18),
  },
  shimmerTitle: {
    width: "70%",
    height: fh(16),
    borderRadius: fh(8),
    marginTop: fh(12),
  },
});
