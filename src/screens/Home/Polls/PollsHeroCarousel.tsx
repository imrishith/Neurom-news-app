import { usePollsStore } from "../../../../utils/store/usePollsStore";
import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet , Platform} from "react-native";
import HeroSnapCarousel from "../../../components/HeroSnapCarousel/HeroSnapCarousel";
import { fw, fh, ff } from "../../../../utils/responsive";
import Colors from "../../../constants/colors";
import { useNavigation } from "@react-navigation/native";
import { useOnboarding } from "../../../context/OnboardingContext";
import { publicPolls } from "../../../api/publicapi/publicApi";
import { timeAgo } from "../../../../utils/timeAgo";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";

// âœ… Top-right "Views" badge (blue pill)
const ViewsBadge = ({
  count,
  getFont,
}: {
  count: number;
  getFont: (w: string) => string;
}) => (
  <View style={styles.viewsBadgeContainer}>
    <Text style={[styles.viewsBadgeText, { fontFamily: getFont("medium") }]}>
      Views {count}
    </Text>
  </View>
);

export default function PollsHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { polls, fetchPolls } = usePollsStore() as any;
  const navigation = useNavigation<any>();
  const { data, getFont , getLangCode} = useOnboarding();

  // ðŸ”¹ Fetch public polls
  useEffect(() => {
      setLoading(true);
      fetchPolls().finally(() => setLoading(false));
  }, []);

  // ðŸ”¹ Build hero items before any early returns to keep hook order stable
 const heroPolls = useMemo(() => {
  const isTelugu = (data?.language_code || "en") === "te"; // âœ… language selector
  const items = polls || [];

  return items.map((p: any) => {
    // ðŸ§  Select proper question
    const title = isTelugu ? p.question_te || p.question_en : p.question_en || p.question_te;

    // ðŸ§  Handle multilingual options gracefully (if needed later)
    let options: string[] = [];
    if (Array.isArray(p.options)) {
      options = p.options;
    } else if (p.options && typeof p.options === "object") {
      options = isTelugu ? p.options.te || p.options.en : p.options.en || p.options.te;
    }

    return {
      id: String(p.poll_id),
      title,
      options,
      image: p.media?.url ? { uri: p.media.url } : null,
      views: p.stats?.views_count ?? 0,
      createdAt: p.created_at,
      payload: p,
    };
  });
}, [polls, data?.language_code]);


  // ðŸ”¹ Shimmer while loading
  if (loading) {
    return (
      <View style={styles.shimmerWrapper}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.shimmerCard}>
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              style={styles.shimmerImage}
            />
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              style={styles.shimmerText}
            />
          </View>
        ))}
      </View>
    );
  }

  if (!heroPolls || heroPolls.length === 0) return null;

  return (
    <View>
      <HeroSnapCarousel
        data={heroPolls}
        onSnapToItem={(index: number) => setActiveIndex(index)}
        cardWidthPct={0.9}
        aspectRatio={1.6}
        gap={0.1}
        showMetaChip
        // âœ… Render blue "Views" badge in top-right corner
        // renderTopRight={(item) => (
        //   <ViewsBadge count={item.views} getFont={getFont} />
        // )}
        // âœ… Title with proper font
        renderTitle={(item) => (
          <Text
            style={[styles.titleText, { fontFamily: getFont("semibold"), fontWeight: "700" }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        )}
        // âœ… Navigate to pollScreen
        onPressItem={(item) =>
          navigation.navigate("pollScreen", {
            selectedPollId: String(item.payload.poll_id),
          })
        }
      />

      {/* âœ… Pagination dots */}
      <View style={styles.paginationContainer}>
        {heroPolls.map((_, index) => (
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
  titleText: {
    fontSize: ff(14),
    color: Colors.textcolor,
    paddingHorizontal: fw(12),
    marginTop: fh(8),
    lineHeight: Platform.OS === "ios" ? ff(35) : ff(22),
    width: fw(280),
    flexWrap: "wrap",
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
  // ðŸ”¹ Views badge styling
  viewsBadgeContainer: {
    backgroundColor: "#1B1BFB",
    borderRadius: fw(16),
    paddingHorizontal: fw(10),
    paddingVertical: fh(6),
    alignItems: "center",
    justifyContent: "center",
    marginRight: fw(10),
    marginTop: fh(10),
  },
  viewsBadgeText: {
    color: "#fff",
    fontSize: ff(10),
  },
  // ðŸ”¹ Shimmer styles
  shimmerWrapper: {
    height: fh(200),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: fw(12),
  },
  shimmerCard: {
    width: fw(260),
    borderRadius: fw(12),
    overflow: "hidden",
  },
  shimmerImage: {
    width: "100%",
    height: fh(140),
    borderRadius: fw(12),
  },
  shimmerText: {
    width: "80%",
    height: fh(20),
    marginTop: fh(8),
    borderRadius: fw(6),
    alignSelf: "center",
  },
});


