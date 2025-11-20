import React, { useState, useMemo, useEffect } from 'react';
import { Image, TouchableOpacity, View, Text, StyleSheet, Platform, FlatList } from 'react-native';
import HeroSnapCarousel, { HeroItem } from '../../components/HeroSnapCarousel/HeroSnapCarousel';
import { fw, fh, ff } from '../../../utils/responsive';
import Colors from '../../constants/colors';
import { timeAgo } from "../../../utils/timeAgo";
import { useArticlesStore } from '../../../utils/store/useArticlesStore';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnboardingContext';
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";

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
    <Text style={[styles.topRightText, { fontFamily: getFont("semibold") }]}>{location}</Text>
    <Text style={[styles.topRightText, styles.timeAgoText, { fontFamily: getFont("semibold") }]}>{timeAgo}</Text>
  </View>
);

export default function BreakingNewsHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { t, data, getFont, getLangCode } = useOnboarding();
  const { breakingNews, fetchBreakingNews, articles } = useArticlesStore() as any;

  useEffect(() => {
    const needsLoader = !breakingNews || breakingNews.length === 0;
    if (needsLoader) setLoading(true);
    fetchBreakingNews().finally(() => {
      if (needsLoader) setLoading(false);
    });
  }, []);

  const breakingArticles: HeroItem[] = useMemo(() => {
    const isTelugu = getLangCode() === "te";
    return (breakingNews || []).map((a: any) => ({
      id: a.article_id,
      image:
        a.media?.type === "video"
          ? { uri: a.media?.thumbnail }
          : a.media?.url
            ? { uri: a.media.url }
            : require("../../../assets/images/factory.png"),
      title: isTelugu ? a.title_te : a.title_en,
      subtitle: isTelugu ? a.Category?.name_te || a.Category?.name_en : a.Category?.name_en,
      metaText: "Breaking",
      payload: { type: "article", id: a.article_id, data: a },
      createdAt: a.created_at,
    }));
  }, [breakingNews, getLangCode]);

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

  if (loading && (!breakingNews || breakingNews.length === 0)) {
    return (
      <View style={styles.shimmerWrapper}>
        <FlatList
          horizontal
          data={shimmerData}
          keyExtractor={(item) => `breaking-shimmer-${item}`}
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
        onSnapToItem={(index: number) => setActiveIndex(index)}
        cardWidthPct={0.9}
        aspectRatio={1.6}
        gap={0.1}
        peekMultiplier={1}
        showMetaChip={true}
        onPressItem={(item) => {
          if (item.payload?.type === "article") {
            const articleData = item.payload.data;

            const exists = (articles || []).some(
              (a: any) => a.article_id === articleData.article_id
            );

            if (!exists) {
              const newArticles = [articleData, ...(articles || [])];
              useArticlesStore.setState({ articles: newArticles });
            }

            navigation.navigate("ArticleScreen", {
              articleId: articleData.article_id,
              fromBreaking: true,
            });
          }
        }}
        renderRight={(item) => (
          <TouchableOpacity
            style={styles.listenNowButton}
            onPress={() => {
              const articleData = item.payload.data;

              const exists = (articles || []).some(
                (a: any) => a.article_id === articleData.article_id
              );

              if (!exists) {
                const newArticles = [articleData, ...(articles || [])];
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
                    source={require("../../../assets/icons/wave.png")}
                    style={{ width: fw(10), height: fh(10), tintColor: '#fff' }}
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
            style={[styles.titleText, { fontFamily: getFont("semibold"), fontWeight: "700" }]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
        )}
      />

      {/* ✅ Pagination dots */}
      <View style={styles.paginationContainer}>
        {breakingArticles.map((_, index) => (
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
    fontWeight: "700",
    color: Colors.textcolor,
    paddingHorizontal: fw(12),
    marginTop: fh(8),
    lineHeight: Platform.OS === "ios" ? ff(35) : ff(22),
    width: fw(280),
    textAlign: "left",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "flex-start",
    gap: fh(12),
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
