import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";

import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { fw, fh, ff } from "../../../../utils/responsive";

import { useTheme } from "../../../context/ThemeContext";
import { useOnboarding } from "../../../context/OnboardingContext";
import { timeAgo } from "../../../../utils/timeAgo";

import { getStateArticles } from "../../../../src/api/users/contentApi";

const ExclusivesCarousel = () => {
  const navigation = useNavigation<any>();
  const { Colors } = useTheme();
  const { getFont, getLangCode, t } = useOnboarding();

  const [exclusiveArticles, setExclusiveArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------
  // FETCH EXCLUSIVE ARTICLES (LOCAL STATE ONLY — NO STORE)
  // -----------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await getStateArticles(
          undefined,   // cursor
          undefined,   // category
          undefined,   // is_breaking
          undefined,   // is_trending
          true         // is_exclusive
        );

        if (res?.success) {
          setExclusiveArticles(res.data.items || []);
        }
      } catch (err) {
        console.log("❌ Exclusive fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // -----------------------------------------------------
  // MAP DATA
  // -----------------------------------------------------
  const exclusiveItems = useMemo(() => {
    const isTelugu = getLangCode() === "te";

    return exclusiveArticles.map((a) => ({
      id: a.article_id,
      title: isTelugu ? a.title_te : a.title_en,
      timeAgo: timeAgo(a.created_at),
      image:
        a.media?.type === "video" && a.media?.thumbnail
          ? { uri: a.media.thumbnail }
          : a.media?.url
            ? { uri: a.media.url }
            : require("../../../../assets/images/factory.png"),
      data: a,
    }));
  }, [exclusiveArticles, getLangCode]);

  // -----------------------------------------------------
  // RENDER CARD
  // -----------------------------------------------------
  const renderExclusiveCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.verticalCard, { borderColor: Colors.mediumGray }]}
      onPress={() => {
        navigation.navigate("ArticleScreen", {
          articleId: item.data.article_id,
          fromExclusive: true,
        });
      }}
      activeOpacity={0.85}
    >
      <Image source={item.image} style={styles.verticalCardImage} resizeMode="cover" />

      <LinearGradient
        colors={[
          "rgba(0,0,0,0)",
          "rgba(0,0,0,0.25)",
          "rgba(0,0,0,0.6)",
          "rgba(0,0,0,0.9)",
        ]}
        locations={[0, 0.4, 0.75, 1]}
        style={styles.bottomShade}
      />

      <View style={styles.verticalTextOverlay}>
        <Text
          numberOfLines={2}
          style={[
            styles.verticalText,
            { color: "#fff", fontFamily: getFont("semibold") },
          ]}
        >
          {item.title}
        </Text>

        <Text style={styles.timeAgoText}>
          {item.timeAgo}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (exclusiveItems.length === 0) return null;

  return (
    <View>
      {/* Heading */}
      <View style={styles.sectionHeadingRow}>
        <Text
          style={[
            styles.sectionHeading,
            {
              color: Colors.textcolor,
              fontFamily: getFont("bold"),
              fontWeight: "700",
            },
          ]}
        >
          {t("exclusives")}
        </Text>
      </View>

      {/* List */}
      <FlatList
        horizontal
        data={exclusiveItems}
        renderItem={renderExclusiveCard}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalCarouselContent}
        snapToInterval={fw(132)}
        decelerationRate="fast"
      />
    </View>
  );
};

export default ExclusivesCarousel;

// -----------------------------------------------------
// STYLES
// -----------------------------------------------------
const styles = StyleSheet.create({
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: fw(20),
    marginTop: fh(15),
  },
  sectionHeading: {
    fontSize: ff(16),
    lineHeight: Platform.OS === "ios" ? ff(35) : ff(22),
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
  verticalCardImage: {
    width: "100%",
    height: "100%",
  },

  bottomShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: fh(140),
  },

  verticalTextOverlay: {
    position: "absolute",
    bottom: fh(8),
    left: fw(8),
    right: fw(8),
  },

  verticalText: {
    fontSize: ff(12),
    marginBottom: fh(4),
  },

  timeAgoText: {
    fontSize: ff(10),
    color: "#ddd",
  },
});
