import React, { useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Video from "react-native-video";
import { useNavigation } from "@react-navigation/native";
import { fw, fh, ff } from "../../../../utils/responsive";

import { useTheme } from "../../../context/ThemeContext";
import { useArticlesStore } from "../../../../utils/store/useArticlesStore";
import { useVideosStore } from "../../../../utils/store/useVideosStore";
import { useOnboarding } from "../../../context/OnboardingContext"; // ✅ translations + fonts

const ExclusivesCarousel = () => {
  const navigation = useNavigation<any>();
  const { Colors } = useTheme();
  const { data, t, getFont, getLangCode } = useOnboarding(); // ✅ added getLangCode
  const { exclusiveArticles, fetchExclusiveArticles } = useArticlesStore();
  const { exclusiveVideos, fetchExclusiveVideos } = useVideosStore();
  // Fetch exclusives on mount and when language/state changes
  useEffect(() => {
    fetchExclusiveArticles();
    fetchExclusiveVideos();
  }, []);
  // Post-fetch counts for debugging

  const exclusiveItems = useMemo(() => {
    const isTelugu = getLangCode() === "te"; // ✅ corrected mapping

    const mappedArticles = (exclusiveArticles || []).map((a: any) => ({
      id: `article-${a.article_id}`,
      type: "article",
      title: isTelugu ? a.title_te : a.title_en,
      image:
        a.media?.type === "video" && a.media?.thumbnail
          ? { uri: a.media.thumbnail } // 🎥 use video thumbnail
          : a.media?.url
            ? { uri: a.media.url } // 🖼️ normal image
            : require("../../../../assets/images/factory.png"), // 🏭 fallback
      data: a,
    }));

    const mappedVideos = (exclusiveVideos || []).map((v: any) => ({
      id: `video-${v._id}`,
      type: "video",
      title: isTelugu
        ? v.title_te || v.title || t("untitled_video")
        : v.title_en || v.title || t("untitled_video"),
      video: v.uri || { uri: v.url },
      image: v.thumbnail ? { uri: v.thumbnail } : require("../../../../assets/images/factory.png"),
      data: v,
    }));

    // ✅ Randomize and take 6
    const combined = [...mappedArticles, ...mappedVideos];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined
  }, [exclusiveArticles, exclusiveVideos, getLangCode]);

  const renderExclusiveCard = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.verticalCard, { borderColor: Colors.mediumGray }]}
      onPress={() => {
        if (item.type === "article") {
          const { articles } = useArticlesStore.getState();


          // Check if article already exists
          const exists = articles.some(
            (a: any) => a.article_id === item.data.article_id
          );

          if (!exists) {
            // Merge only the selected record
            const newArticles = [item.data, ...articles];

            useArticlesStore.setState({ articles: newArticles });


          } else {
            console.log("⚠️ Article already exists:", item.data.article_id);
          }

          // Navigate and flag as fromExclusive
          navigation.navigate("ArticleScreen", {
            articleId: item.data.article_id,
            fromExclusive: true, // important flag
          });
        } else if (item.type === "video") {
          const { videos, videosByCategory } = useVideosStore.getState();



          const existsTop = videos.some((v: any) => v.video_id === item.data.video_id);

          const allKey = "all";
          const cachedAll = videosByCategory?.[allKey] ?? {
            items: [],
            cursor: null,
            hasMore: true,
            lastFetchedAt: null,
          };
          const existsInAll = (cachedAll.items || []).some(
            (v: any) => String(v.video_id) === String(item.data.video_id)
          );

          const nextVideos = existsTop ? videos : [item.data, ...videos];
          const nextAllCache = existsInAll
            ? cachedAll
            : {
              ...cachedAll,
              items: [item.data, ...(cachedAll.items || [])],
              lastFetchedAt: Date.now(),
            };

          if (!existsTop || !existsInAll) {
            useVideosStore.setState({
              videos: nextVideos,
              videosByCategory: {
                ...(videosByCategory || {}),
                [allKey]: nextAllCache,
              },
            });

          } else {
            console.log("⚠️ Video already exists in caches:", item.data.video_id);
          }

          // ✅ Navigate to ReelsScreen (use your correct route name)
          navigation.navigate("ReelsScreen", {
            videoId: item.data.video_id,
            fromExclusive: true,
          });
        }

      }}



    >
      {item.type === "video" ? (
        <>
          {/* <Video
            source={item.video}
            style={styles.verticalCardImage}
            resizeMode="cover"
            paused={true}
            muted={true}
          /> */}
          <Image
            source={item.image}
            style={styles.verticalCardImage}
            resizeMode="cover"
          />
          <View style={styles.playButtonWrapper}>
            <Image
              source={require("../../../../assets/icons/play.png")}
              style={styles.playButton}
            />
          </View>
        </>
      ) : (
        <Image
          source={item.image}
          style={styles.verticalCardImage}
          resizeMode="cover"
        />
      )}

      <LinearGradient
        colors={[
          "rgba(0,0,0,0)",      // fully transparent at the top
          "rgba(0,0,0,0.25)",   // light fade
          "rgba(0,0,0,0.6)",    // medium opacity
          "rgba(0,0,0,0.9)"     // almost black at bottom
        ]}
        locations={[0, 0.4, 0.75, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomShade}
      />

      <View style={styles.verticalTextOverlay}>
        <Text
          style={[
            styles.verticalText,
            { color: "#fff", fontFamily: getFont("semibold"), fontWeight: "600" },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (exclusiveItems.length === 0) {
    return null; // nothing to render
  }

  return (
    <View>
      <View style={styles.sectionHeadingRow}>
        <Text
          style={[
            styles.sectionHeading,
            {
              color: Colors.textcolor,
              fontFamily: getFont("bold"),
              fontWeight: "700",
              fontSize: ff(16),
            },
          ]}
        >
          {t("exclusives")}
        </Text>
      </View>

      <FlatList
        horizontal
        data={exclusiveItems}
        renderItem={renderExclusiveCard}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalCarouselContent}
        snapToInterval={fw(132)}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: fw(20),
    gap: 10,
    marginTop: fh(15),
  },
  sectionHeading: {
    fontSize: ff(14),
    top: fh(-2),
    left: fh(8),
    lineHeight: Platform.OS === "ios" ? ff(35) : ff(22) ,
  },
  horizontalCarouselContent: {
    paddingHorizontal: fw(20),
  },
  verticalCard: {
    width: fw(120),
    height: fh(164),
    borderRadius: fw(12),
    overflow: "hidden",
    marginRight: fw(12),
    position: "relative",
    borderWidth: 1,
    marginTop: fh(10),
  },
  verticalCardImage: { width: "100%", height: "100%" },
  playButtonWrapper: {
    position: "absolute",
    top: "40%",
    left: "35%",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: fw(30),
    height: fw(30),
    resizeMode: "contain",
    tintColor: "#fff",
  },
  bottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: fh(150),          // adjust for taller or shorter gradient
    opacity: 1,             // ✅ overall transparency control
  },
  verticalTextOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "flex-start",   // ✅ align to left
    paddingHorizontal: fw(8),   // ✅ add some side padding
    paddingBottom: fh(8),
    lineHeight: ff(18),
  },

  verticalText: {
    fontSize: ff(12),
    textAlign: "left",       // ✅ make text left-aligned
    width: "100%",           // ✅ let it use full width
  },
});

export default ExclusivesCarousel;
