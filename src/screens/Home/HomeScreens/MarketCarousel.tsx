// src/screens/Home/components/MarketCarousel.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { fw, fh, ff } from "../../../../utils/responsive";
import { useTheme } from "../../../context/ThemeContext";
import { useOnboarding } from "../../../context/OnboardingContext";
import { API_CONFIG } from "../../../api/config/apiConfig";

const MARKET_CARD_W = fw(140);
const MARKET_GAP = fw(12);
const MARKET_SNAP = MARKET_CARD_W + MARKET_GAP;

const MarketCarousel = () => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMarketSlide, setActiveMarketSlide] = useState(0);

  const navigation = useNavigation<any>();
  const { Colors } = useTheme();
  const { t, getFont } = useOnboarding();

  // 🔹 Fetch metal prices
  useEffect(() => {
    const fetchMetals = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://api.Neuromindia.com/api/public/users/metal-prices"
        );
        const json = await res.json();

        if (json?.success && Array.isArray(json?.message)) {
          // ✅ Normalize data for UI cards
          const formatted = json.message.map((item) => ({
            id: item.id,
            title: item.metal === "XAU" ? "Gold (24K)" : "Silver",
            metal: item.metal,
            price: item.price_gram_24k?.toFixed(2),
            price_full: item.price,
            currency: item.currency,
            change_pct: item.change_pct
          }));
          setMarkets(formatted);
        } else {
          setMarkets([]);
        }
      } catch (err) {
        console.error("❌ Error fetching metal prices:", err);
        setMarkets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetals();
  }, []);

  const renderMarketCard = ({ item }: any) => {
    const deltaColor = item.change_pct < 0 ? "#FF4D4D" : "#3ED07D";
    const arrow = item.change_pct < 0 ? "↓" : "↑";

    // ✅ Local icon map
    const metalIcons: Record<string, any> = {
      XAU: require("../../../../assets/images/gold.png"),
      XAG: require("../../../../assets/images/silver.png"),
    };

    return (
      <TouchableOpacity
        activeOpacity={1}
        style={[
          styles.marketCard,
          {
            width: MARKET_CARD_W,
            marginRight: MARKET_GAP,
            borderColor: Colors.mediumGray,
          },
        ]}
        onPress={() => {
          navigation.navigate("MarketDetailsScreen", { market: item });
        }}
      >
        <Image
          source={metalIcons[item.metal] || require("../../../../assets/images/gold.png")}
          style={styles.marketImage}
          resizeMode="cover"
        />

        <View style={styles.overlay} />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]}
          style={styles.gradientOverlay}
        />

        <View style={styles.marketBottom}>
          <View style={styles.marketTopRow}>
            <Text
              style={[
                styles.marketLabel,
                { color: "#fff", fontFamily: getFont("regular") },
              ]}
            >
              {item.metal === "XAU" ? "Gold (24K)" : "Silver"}
            </Text>
            <Text
              style={[
                styles.marketPrice,
                { color: "#fff", fontFamily: getFont("bold") },
              ]}
            >
              ₹{item.price}
            </Text>

          </View>
          <Text
            style={[
              styles.marketDelta,
              { color: deltaColor, fontFamily: getFont("semiBold") },
            ]}
          >
            {arrow} {Math.abs(item.change_pct).toFixed(2)}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View>
      {/* Section heading */}
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
          {t("todays_market")}
        </Text>
      </View>

      {loading ? (
        <View
          style={{
            height: fh(100),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="small" color={Colors.lavenderPurple} />
        </View>
      ) : (
        <FlatList
          horizontal
          data={markets}
          renderItem={renderMarketCard}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalCarouselContent}
          snapToInterval={MARKET_SNAP}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const index = Math.round(x / MARKET_SNAP);
            setActiveMarketSlide(index);
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
  sectionHeading: {
    fontSize: ff(14),
    fontWeight: "600",
    top: fh(-2),
    left: fw(8),
  },
  horizontalCarouselContent: {
    paddingHorizontal: fw(20),
  },
  marketCard: {
    borderRadius: fw(12),
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
    borderWidth: 1,
    marginTop: fh(10),
    height: fh(100),
  },
  marketImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  marketBottom: {
    position: "absolute",
    left: fw(8),
    right: fw(8),
    bottom: fh(10),
  },
  marketTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marketLabel: {
    fontSize: ff(12),
    bottom: fh(-10),
  },
  marketPrice: {
    fontSize: ff(12),
    bottom: fh(-10),
  },
  marketDelta: {
    marginTop: fh(2),
    fontSize: ff(8),
    bottom: fh(-5),
  },
});

export default MarketCarousel;
