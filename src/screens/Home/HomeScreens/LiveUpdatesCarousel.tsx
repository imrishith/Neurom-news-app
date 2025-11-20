// screens/Home/components/LiveUpdatesCarousel.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing 
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { useNavigation } from "@react-navigation/native";
import Circle from "../../../components/Circle";
import { fw, fh, ff } from "../../../../utils/responsive";
import { useTheme } from "../../../context/ThemeContext";
import { useOnboarding } from "../../../context/OnboardingContext";
import { publicLiveUpdates } from "../../../api/publicapi/publicApi"; // ✅ use centralized API
import LivePulse from "../../../components/LivePulse";

const LiveUpdatesCarousel = () => {
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const navigation = useNavigation<any>();
  const { Colors } = useTheme();
  const { data, getFont, getLocalizedText, t } = useOnboarding();
  const pulseAnim = useState(new Animated.Value(1))[0];

  // 🔹 Fetch Live Updates API
  useEffect(() => {
    const fetchLiveUpdates = async () => {
      try {
        setLoading(true);
        const json = await publicLiveUpdates.list(); // ✅ central API call

        if (json?.success && Array.isArray(json.data?.items)) {
          setLiveUpdates(json.data.items);
        } else {
          setLiveUpdates([]);
        }
      } catch (err) {
        console.error("❌ Error fetching live updates:", err);
        setLiveUpdates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveUpdates();
  }, []);

  useEffect(() => {
  const pulse = Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.2, // fade out
        duration: 600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1, // fade in
        duration: 600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  );
  pulse.start();

  return () => pulse.stop();
}, []);

  // 🔹 Render shimmer card while loading
  const ShimmerCard = () => (
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

  // 🔹 Render each live update card
  const renderVerticalCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.verticalCard, { borderColor: Colors.mediumGray }]}
      onPress={() =>
        navigation.navigate("LiveUpdateScreen", {
           liveUpdate: item, // pass entire item
        })
      }
    >
      <Image
        source={{ uri: item.media.url }}
        style={styles.verticalCardImage}
        resizeMode="cover"
      />

      {/* Gradient overlay */}
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

      {/* Title overlay */}
      <View style={styles.verticalTextOverlay}>
        <Text
          style={[
            styles.sectionHeading,
            { fontFamily: getFont("regular"), color: "#fff", fontWeight: "600" },
          ]}
          numberOfLines={2}
        >
          {getLocalizedText(item, "title")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!loading && liveUpdates.length === 0) {
    return null; // 👈 Don't render anything
  }

  return (
    <View>
      {/* 🔹 Section Heading */}
      <View style={styles.sectionHeadingRow}>
       <Animated.View style={{ opacity: pulseAnim }}>
  {/* <Circle
    size={10}
    backgroundColor={Colors.alertRed}
    imageStyle={styles.sectionIconImage}
  /> */}
  <LivePulse />
</Animated.View>
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
          {t("live_now")}
        </Text>
      </View>

      {loading ? (
        <FlatList
          horizontal
          data={[1, 2, 3, 4]} // 4 shimmer placeholders
          keyExtractor={(item) => String(item)}
          renderItem={() => <ShimmerCard />}
          contentContainerStyle={styles.horizontalCarouselContent}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <FlatList
          horizontal
          data={liveUpdates}
          renderItem={renderVerticalCard}
          keyExtractor={(item) => String(item.live_update_id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalCarouselContent}
          snapToInterval={fw(132)}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / fw(132));
            setActiveSlide(index);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: fw(20),
    gap: 10,
    marginTop: fh(10),
  },
  sectionIconImage: {
    width: fw(18),
    height: fw(18),
    resizeMode: "contain",
  },
  sectionHeading: {
    fontSize: ff(12),
    top: fh(-2),
  },
  horizontalCarouselContent: {
    paddingHorizontal: fw(20),
  },

  // 🔹 Live Update Card
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
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: fh(8),
  },

  // 🔹 Shimmer Placeholder
  shimmerCard: {
    width: fw(120),
    height: fh(164),
    borderRadius: fw(12),
    marginRight: fw(12),
    marginTop: fh(10),
    overflow: "hidden",
  },
  shimmerImage: {
    width: "100%",
    height: "80%",
    borderRadius: fw(12),
  },
  shimmerTitle: {
    width: "70%",
    height: fh(14),
    marginTop: fh(6),
    borderRadius: 4,
    alignSelf: "center",
  },
});

export default LiveUpdatesCarousel;
