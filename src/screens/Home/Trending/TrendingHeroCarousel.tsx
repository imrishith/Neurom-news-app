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
import { useArticlesStore } from "../../../../utils/store/useArticlesStore";
import { useNavigation } from "@react-navigation/native";
import { useOnboarding } from "../../../context/OnboardingContext"; // ✅ translations + fonts
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";

// 🔹 Top-right "Views" badge
const ViewsBadge = ({
  views,
  t,
  getFont,
}: {
  views: string | number;
  t: (k: string) => string;
  getFont: (w: string) => string;
}) => (
  // <View style={styles.viewsBadgeContainer}>
  //   <Image
  //     source={require("../../../../assets/icons/eye.png")}
  //     style={styles.eyeIcon}
  //   />
  //   <Text style={[styles.viewsBadgeText, { fontFamily: getFont("medium") }]}>
  //      {views}
  //   </Text>
  // </View>
  <View></View>
);

export default function TrendingHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { data, getFont, getLangCode, t } = useOnboarding();
  const { trendingNews, fetchTrendingNews } = useArticlesStore() as any;
  const shimmerData = useMemo(() => [1, 2, 3, 4], []);

  // 🟣 Fetch trending articles on mount
  useEffect(() => {
    setLoading(true);
    fetchTrendingNews().finally(() => setLoading(false));
  }, []);

  // ✅ Filter & map API response to HeroItems
  const trendingArticles: HeroItem[] = useMemo(() => {
    const isTelugu = getLangCode() === "te";

    return (trendingNews || [])

      .map((a: any) => {
        const imageSource =
          a.media?.type === "video" && a.media?.thumbnail
            ? { uri: a.media.thumbnail }             // 🎥 show video thumbnail
            : a.media?.url
              ? { uri: a.media.url }                   // 🖼️ show image normally
              : require("../../../../assets/images/factory.png"); // 🏭 fallback

        return {
          id: a.article_id,
          image: imageSource,
          title: isTelugu ? a.title_te : a.title_en,
          views: a.stats?.views_count ?? 0,
          payload: { type: "article", id: a.article_id },
        };
      });
  }, [trendingNews, getLangCode]);

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

  if (loading && (!trendingNews || trendingNews.length === 0)) {
    return (
      <View style={styles.shimmerWrapper}>
        <FlatList
          horizontal
          data={shimmerData}
          keyExtractor={(item) => `trending-shimmer-${item}`}
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
        onSnapToItem={(index: number) => setActiveIndex(index)}
        cardWidthPct={0.9}
        aspectRatio={1.6}
        gap={0.1}
        showMetaChip={true}
        renderTopRight={(item) => (
          <ViewsBadge views={item.views} t={t} getFont={getFont} />
        )}
        renderTitle={(item) => (
          <Text
            style={[
              styles.titleText,
              {
                fontFamily: getFont("semibold"),
                color: Colors.textcolor,
                fontWeight: "700",
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
        )}
        renderRight={(item) => (
         <TouchableOpacity
                     style={styles.listenNowButton}
                     onPress={() => {
                       const { articles } = useArticlesStore.getState();
                       const articleData = item.payload.data;
         
                       const exists = articles.some(
                         (a: any) => a.article_id === articleData.article_id
                       );
         
                       if (!exists) {
                         const newArticles = [articleData, ...articles];
                         useArticlesStore.setState({ articles: newArticles });
         
                       }
         
                       navigation.navigate("ArticleScreen", {
                         articleId: articleData.article_id,
                         fromBreaking: true,
                         mode: "audio",
                       });
                     }}
                     activeOpacity={0.8}
                   >
                     <View style={styles.listenNowContent}>
                       <Text style={[styles.listenNowText]}>
                         {t("audio")}
                       </Text>
                       <View style={styles.listenNowIconWrap}>
                         <View style={styles.listenNowWaves}>
                           <Image
                             source={require("../../../../assets/icons/wave.png")}
                             style={{ width: fw(10), height: fh(10), tintColor: '#fff' }}
                           />
                         </View>
                       </View>
                     </View>
                   </TouchableOpacity>

        )}
        onPressItem={(item) => {
          if (item.payload?.type === "article") {
            const store = useArticlesStore.getState();
            const { articles } = store;

            // Find if article already exists
            const exists = articles.some(
              (a) => a.article_id === item.payload.id
            );

            if (!exists) {
              // Get the full article object from trendingNews
              const trendingItem = store.trendingNews.find(
                (a) => a.article_id === item.payload.id
              );

              if (trendingItem) {
                const newArticles = [trendingItem, ...articles];
                useArticlesStore.setState({ articles: newArticles });

              }
            } else {
              console.log("⚠️ Trending article already exists:", item.payload.id);
            }

            // Now navigate
            navigation.navigate("ArticleScreen", {
              articleId: item.payload.id,
              fromTrending: true,
            });
          }
        }}

      />

      {/* ✅ Pagination dots */}
      <View style={styles.paginationContainer}>
        {trendingArticles.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, activeIndex === index && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewsBadgeContainer: {
    backgroundColor: "#D73C3E",
    borderRadius: fw(16),
    paddingHorizontal: fw(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: fh(20),
    marginRight: fw(18),
    marginTop: fh(10),
  },
  eyeIcon: {
    width: fw(10),
    height: fw(10),
    tintColor: "#fff",
    marginRight: fw(2),
    resizeMode: "contain",
  },
  viewsBadgeText: {
    fontSize: ff(10),
    color: "#FFFFFF",
  },
  liveNowWrapper: {
    marginRight: fw(-8),
    marginBottom: fh(-80),
  },
  liveNowImage: {
    width: fw(79),
    height: fh(30),
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
  titleText: {
    fontSize: ff(14),
    color: Colors.textcolor,
    paddingHorizontal: fw(12),
    marginTop: fh(8),
    lineHeight: Platform.OS === "ios" ? ff(35) : ff(22),
    width: fw(280),
    textAlign: "left",
  },

  listenNowButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: fw(20),
    width: fw(70),
    height: fh(22),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: fw(-8),
    marginBottom: fh(-80),
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  listenNowContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },

  listenNowText: {
    color: '#000',
    fontSize: ff(12),
    fontWeight: '200',
    textAlign: 'center',
    paddingRight: fw(18),
  },

  listenNowIconWrap: {
    position: 'absolute',
    right: fw(-2),
    top: '40%',
    transform: [{ translateY: -fh(11) }],
    width: fw(25),
    height: fh(25),
    borderRadius: fw(20),
    backgroundColor: '#836AD9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  listenNowWaves: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: fw(2),
  },

  wave: {
    width: fw(2),
    backgroundColor: '#fff',
    borderRadius: fw(1),
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
    borderRadius: fw(14),
    marginRight: fw(12),
    marginTop: fh(10),
    backgroundColor: "#1f1f1f",
    padding: fw(10),
    justifyContent: "space-between",
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
