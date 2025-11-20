// screens/LiveUpdatesScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  BackHandler
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import io from "socket.io-client";
import Ionicons from "react-native-vector-icons/Ionicons";
import Colors from "../../constants/colors";
import { fw, fh, ff, fr, getLayoutConfig } from "../../../utils/responsive";
import TopBar from "../../components/TopBar";
import SidebarPanel from "../Sidebar/SidebarPanel";
import { useOnboarding } from "../../context/OnboardingContext";
import { useContentTabs } from "../../hooks/useContentTabs";
import { publicLiveUpdates } from '../../api/publicapi/publicApi';
import { API_CONFIG } from "../../api/config/apiConfig";
import LiveUpdateShareModal from "../../components/share/live/LiveUpdateShareModal";
import { performance } from "react-native-performance";

const LiveUpdatesScreen = () => {
  const navigation = useNavigation();
  const { getFont, getLocalizedText, t } = useOnboarding();
  const route = useRoute<any>();

  useEffect(() => {
    const now = global.performance?.now?.() ?? Date.now();
      console.log(`📌 ${route.name} mounted at`, now);
  }, []);

  const { liveUpdate } = route.params || {};
  const liveUpdateId = liveUpdate?.live_update_id;
  const title = getLocalizedText(liveUpdate, "title");
  const bannerUrl = liveUpdate?.media?.url;

  const { tabs, activeTab, setActiveTab, categories } = useContentTabs();

  const [shareVisible, setShareVisible] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const insets = useSafeAreaInsets();

  const BOTTOM_BAR_HEIGHT = fh(65);
  const BASE_MARGIN = fh(12);
  const SAFE_BOTTOM = insets.bottom || 0;

  const FIXED_BOTTOM_OFFSET = BOTTOM_BAR_HEIGHT + SAFE_BOTTOM + BASE_MARGIN;


   // backhandler done by rishith
      useEffect(() => {
        const backAction = () => {
          // ✅ Navigate to Home instead of exiting the app
          navigation.navigate("HomeScreen"); // change to your actual home route name
          return true; // prevent default back behavior (app exit)
        };
    
        const backHandler = BackHandler.addEventListener(
          "hardwareBackPress",
          backAction
        );
    
        return () => backHandler.remove();
      }, [navigation]);
    


  // 🔹 Fetch entries once
  // 🔹 First load: fetch once
  useEffect(() => {
    if (!liveUpdateId) return;

    const fetchInitial = async () => {
      try {
        setLoading(true);
        const json = await publicLiveUpdates.getEntries(liveUpdateId);
        if (json?.success && Array.isArray(json.data?.items)) {
          setEntries(json.data.items);
        } else {
          setEntries([]);
        }
      } catch (err) {
        console.error("❌ Error fetching entries:", err);
        setEntries([]);
      } finally {
        setLoading(false); // ✅ only first fetch shows loader
      }
    };

    fetchInitial();
  }, [liveUpdateId]);

  // 🔹 Socket listener (silent refresh)
  useEffect(() => {
    if (!liveUpdateId) return;

    console.log("🔌 Connecting to socket for live updates...");

    const socket = io("https://api.Neuromindia.com", {
      path: "/api/public/users/socket.io",
      transports: ["websocket"],
      secure: true,
    });

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
      // Join the specific live update room
      socket.emit("join", { live_update_id: liveUpdateId });
    });

    socket.on("connect_error", (err) => {
      console.log("❌ connect_error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("⚠️ Disconnected:", reason);
    });

    socket.on("new_entry", (entry) => {
      console.log("📩 New live entry:", entry);
      setEntries((prev) => [entry, ...prev]);
    });

    socket.on("live_entry", (entry) => {
      console.log("📡 Live entry received:", entry);
      setEntries((prev) => [entry, ...prev]);
    });

    return () => {
      console.log("🛑 Cleaning up socket listeners...");
      socket.off();
      socket.disconnect();
    };
  }, [liveUpdateId]);



  // 🔹 Render timeline item
  const renderItem = ({ item }: { item: any }) => {
    const content = getLocalizedText(item, "content");

    return (
      <View style={styles.timelineItem} >
        <View style={styles.timelineIndicatorContainer}>
          <Image
            source={require("../../../assets/icons/cube.png")}
            style={styles.cubeIcon}
          />
        </View>

        <View style={styles.updateRow}>
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { fontFamily: getFont("regular") }]}>
              {content}
            </Text>

            {item.media_url && (
              <Image
                source={{ uri: item.media_url }}
                style={styles.entryImage}
                resizeMode="cover"
              />
            )}
          </View>

          {/* 🕒 Time just below card, bottom-right outside */}
          {/* <Text style={[styles.timeText, { fontFamily: getFont("medium") }]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text> */}
          <Text style={[styles.timeText, { fontFamily: getFont("medium") }]}>
            {new Date(item.created_at).toLocaleString([], {
              day: "2-digit",
              month: "short",   // e.g. Jan, Feb
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} >
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      <ImageBackground
        source={
          bannerUrl
            ? { uri: bannerUrl }
            : require("../../../assets/images/factory.png")
        }
        style={styles.bgImage}
        resizeMode="cover"
      >
        {/* 🔹 Black overlay */}
        < View style={styles.overlay} />

        {/* 🔹 TopBar */}
        < View style={[styles.topBarWrap, { paddingTop: insets.top }]}>


          {/* 🔹 Live Now button */}
          < TouchableOpacity style={styles.liveNowButton} >
            <Text style={[styles.liveNowText, { fontFamily: getFont("bold") }]}>
              {t("live_now")}
            </Text>
          </TouchableOpacity>
        </View>

        < View style={styles.container} >
          {/* 🔹 Title */}
          < View style={styles.bannerTitleWrap} >
            <Text style={[styles.bannerTitle, { fontFamily: getFont("bold") }]}>
              {title || t("live_updates")}
            </Text>
          </View>

          {/* 🔹 Timeline */}
          <View style={styles.listWrap}>
            <View style={[styles.timelineRail, { left: fw(30) }]} />
            {
              loading ? (
                <ActivityIndicator
                  size="large"
                  color="#fff"
                  style={{ marginTop: fh(20) }
                  }
                />
              ) : (
                <FlatList
                  data={entries}
                  renderItem={renderItem}
                  keyExtractor={(item) => String(item.entry_id)}
                  contentContainerStyle={styles.timelineContainer}
                  showsVerticalScrollIndicator={false}
                />
              )}
          </View>

          {/* 🔹 Share button */}
          <TouchableOpacity
            onPress={() => setShareVisible(true)}
            style={[
              styles.shareButtonFixed,
              { bottom: FIXED_BOTTOM_OFFSET }
            ]}
          >
            <LinearGradient
              useAngle
              angle={200}
              angleCenter={{ x: 0.7, y: 0.5 }}
              colors={["#997DDF", "#7741FF"]}
              style={styles.proceedButton}
            >
              <View style={styles.buttonContent}>
                <Text
                  style={[styles.proceedText, { fontFamily: getFont("medium") }]}
                >
                  {t("share")}
                </Text>
                <Ionicons
                  name="paper-plane-outline"
                  size={24}
                  color="#FFFFFF"
                />

              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 🔹 Modals */}
       <LiveUpdateShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        liveUpdate={liveUpdate}
      />
        < SidebarPanel
          visible={isSidebarVisible}
          onClose={() => setSidebarVisible(false)}
          categories={categories}
          onCategoryPress={(cat) => {
            setActiveTab(cat.key);
            setSidebarVisible(false);
          }}
        />
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.deepPurple },
  bgImage: { flex: 1 },
  container: { flex: 1, zIndex: 2, top: fh(getLayoutConfig().isTablet ? 12 : 15) },

  // 🔹 Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)", // adjust opacity
    zIndex: 1,
  },

  shareButtonFixed: {
    position: "absolute",
    left: 0,
    right: 0,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 50
  },


  // 🔹 Top
  topBarWrap: {
    backgroundColor: "transparent",
    paddingVertical: fh(getLayoutConfig().isTablet ? 12 : 8),
    zIndex: 2,
  },
  liveNowButton: {
    position: "absolute",
    right: fw(getLayoutConfig().isTablet ? 16 : 10),
    top: fh(getLayoutConfig().isTablet ? 64 : 60),
    backgroundColor: "#D73C3E",
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 18 : 14),
    paddingVertical: fh(getLayoutConfig().isTablet ? 6 : 4),
    borderRadius: fr(getLayoutConfig().isTablet ? 20 : 16),
    zIndex: 2,
  },
  liveNowText: {
    color: "#fff",
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12),
    marginTop: fh(getLayoutConfig().isTablet ? 0 : -2),
    includeFontPadding: false,
  },

  bannerTitleWrap: {
    alignItems: "center",
    marginTop: fh(getLayoutConfig().isTablet ? 44 : 40),
    marginBottom: fh(getLayoutConfig().isTablet ? 22 : 18),
    zIndex: 2,
    paddingHorizontal: getLayoutConfig().contentPadding,
  },
  bannerTitle: {
    color: Colors.textcolor,
    fontSize: ff(getLayoutConfig().isTablet ? 24 : 22),
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },

  listWrap: { flex: 1, position: "relative", zIndex: 2 },
  timelineRail: {
    position: "absolute",
    top: fh(getLayoutConfig().isTablet ? 24 : 20),
    bottom: fh(getLayoutConfig().isTablet ? 120 : 100),
    width: fw(getLayoutConfig().isTablet ? 3 : 2),
    backgroundColor: "rgba(255,255,255,0.45)",
    zIndex: 0,
  },
  timelineContainer: { 
    paddingHorizontal: getLayoutConfig().contentPadding, 
    paddingBottom: fh(getLayoutConfig().isTablet ? 24 : 20) 
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 12),
    minHeight: fh(getLayoutConfig().isTablet ? 90 : 80),
    position: "relative",
  },
  timelineIndicatorContainer: {
    position: "absolute",
    left: 0,
    top: fh(getLayoutConfig().isTablet ? 2 : 1),
    width: fw(getLayoutConfig().isTablet ? 32 : 28),
    alignItems: "center",
  },
  cubeIcon: { 
    width: fw(getLayoutConfig().isTablet ? 24 : 20), 
    height: fw(getLayoutConfig().isTablet ? 24 : 20) 
  },
updateRow: {
    flexDirection: "column",
    marginLeft: fw(getLayoutConfig().isTablet ? 44 : 40),
    alignItems: "flex-end",
    marginBottom: fh(getLayoutConfig().isTablet ? 4 : 1),
  },

  card: {
    backgroundColor: Colors.deepPurple,
    width: "100%",
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 16 : 12),
    paddingVertical: fh(getLayoutConfig().isTablet ? 14 : 10),
    borderRadius: fr(getLayoutConfig().isTablet ? 20 : 16),
    position: "relative",
    zIndex: 100
  },

  cardTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    color: Colors.textcolor,
    lineHeight: fh(getLayoutConfig().isTablet ? 24 : 22),
    marginTop: 0,
    paddingTop: 0,
    includeFontPadding: false,
  },

  timeText: {
    marginTop: fh(getLayoutConfig().isTablet ? 4 : 2),
    color: "#fff",
    fontSize: ff(getLayoutConfig().isTablet ? 12 : 10),
    fontWeight: "600",
    opacity: 0.8,
    alignSelf: "flex-end",
    marginRight: fw(getLayoutConfig().isTablet ? 16 : 12),
    includeFontPadding: false,
  },

  entryImage: {
    width: "100%",
    height: fh(getLayoutConfig().isTablet ? 140 : 120),
    borderRadius: fr(getLayoutConfig().isTablet ? 12 : 8),
    marginTop: fh(getLayoutConfig().isTablet ? 12 : 8),
  },

  proceedButton: {
    height: fh(getLayoutConfig().isTablet ? 56 : 50),
    width: fw(getLayoutConfig().isTablet ? 140 : 120),
    borderRadius: fr(getLayoutConfig().isTablet ? 12 : 8),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  buttonContent: { flexDirection: "row", alignItems: "center" },
  proceedText: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    color: "#fff",
    marginRight: fw(getLayoutConfig().isTablet ? 12 : 8),
    includeFontPadding: false,
  },
  buttonIcon: {
    width: fw(getLayoutConfig().isTablet ? 22 : 18),
    height: fw(getLayoutConfig().isTablet ? 22 : 18),
    resizeMode: "contain",
    tintColor: "#fff",
  },
});

export default LiveUpdatesScreen;
