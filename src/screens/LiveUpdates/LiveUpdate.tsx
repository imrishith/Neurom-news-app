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
  BackHandler,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import io from "socket.io-client";
import Ionicons from "react-native-vector-icons/Ionicons";
import Colors from "../../constants/colors";
import { fw, fh, ff } from "../../../utils/responsive";
import { useOnboarding } from "../../context/OnboardingContext";
import { useContentTabs } from "../../hooks/useContentTabs";
import { publicLiveUpdates } from "../../api/publicapi/publicApi";
import LiveUpdateShareModal from "../../components/share/live/LiveUpdateShareModal";

const LiveUpdatesScreen = () => {
  const navigation = useNavigation();
  const { getFont, getLocalizedText, t } = useOnboarding();
  const route = useRoute<any>();
  const { liveUpdate } = route.params || {};
  const [shareVisible, setShareVisible] = useState(false);
  const liveUpdateId = liveUpdate?.live_update_id;
  const title = getLocalizedText(liveUpdate, "title");
  const bannerUrl = liveUpdate?.media?.url;
  const watchers = liveUpdate?.watchers || "12,543";

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const insets = useSafeAreaInsets();

  // Back handler
  useEffect(() => {
    const backAction = () => {
      navigation.navigate("HomeScreen");
      return true;
    };

    const listener = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => listener.remove();
  }, []);

  // Initial Fetch
  useEffect(() => {
    if (!liveUpdateId) return;

    const fetchInitial = async () => {
      try {
        setLoading(true);
        const json = await publicLiveUpdates.getEntries(liveUpdateId);
        if (json?.success && Array.isArray(json.data?.items)) {
          setEntries(json.data.items);
        }
      } catch (e) {
        console.log("❌ Error fetching:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, [liveUpdateId]);

  // Socket Listener
  useEffect(() => {
    if (!liveUpdateId) return;

    const socket = io("https://api.Neuromindia.com", {
      path: "/api/public/users/socket.io",
      transports: ["websocket"],
      secure: true,
    });

    socket.on("connect", () => {
      socket.emit("join", { live_update_id: liveUpdateId });
    });

    socket.on("new_entry", (entry) => {
      setEntries((prev) => [entry, ...prev]);
    });

    socket.on("live_entry", (entry) => {
      setEntries((prev) => [entry, ...prev]);
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [liveUpdateId]);

  // Render each chat bubble
  const renderItem = ({ item }: { item: any }) => {
    const content = getLocalizedText(item, "content");
    return (
      <View style={styles.timelineItem}>
        {/* Left Red Bar stays same */}
        <View style={styles.cubeHolder}>
          <Image
            source={require("../../../assets/icons/cube.png")}
            style={styles.cubeIcon}
          />
        </View>

        <View style={styles.messageContainer}>


          <View style={styles.chatBubble}>

            {/* Time inside bubble - top */}
            <Text
              style={[styles.timeInsideBubble, { fontFamily: getFont("medium") }]}
            >
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            <View style={styles.rowInside}>
              <View style={styles.leftAccent} />

              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.chatText, { fontFamily: getFont("regular") }]}
                >
                  {content}
                </Text>

                {item.media_url && (
                  <Image
                    source={{ uri: item.media_url }}
                    style={styles.entryImage}
                  />
                )}
              </View>
            </View>
          </View>

        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <View style={styles.overlay} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + fh(10) }]}>

          {/* BACK BUTTON */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={fw(26)} color="#fff" />
          </TouchableOpacity>

          {/* TITLE AREA */}
          <View style={styles.titleContainer}>
            <Text
              style={[styles.headerTitle, { fontFamily: getFont("bold") }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>

          {/* LIVE PILL */}
          <View style={styles.livePill}>
            <Text style={[styles.liveText, { fontFamily: getFont("bold") }]}>
              LIVE
            </Text>
          </View>

        </View>


        {/* Modal Glass Card */}
        <View style={styles.modalCard}>
          <View style={styles.timelineRail} />

          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <FlatList
              data={entries}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.entry_id)}
              contentContainerStyle={{ paddingVertical: fh(20) }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* SHARE BUTTON FIXED AT BOTTOM */}
        <View style={styles.shareButtonWrapper}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShareVisible(true)}
          >
            <LinearGradient
              useAngle
              angle={210}
              colors={["#997DDF", "#7741FF"]}
              style={styles.shareGradient}
            >
              <Ionicons name="share-social-outline" size={fw(18)} color="#fff" />
              <Text style={[styles.shareText, { fontFamily: getFont("medium") }]}>
                {t("share")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <LiveUpdateShareModal
          visible={shareVisible}
          onClose={() => setShareVisible(false)}
          liveUpdate={liveUpdate}
        />
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  bgImage: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: fw(16),
    justifyContent: "space-between",
    marginTop: fh(50),
  },
  backBtn: { padding: fw(6), paddingRight: fw(10) },

  subTitle: { color: "#a6a6a6", marginTop: fh(4), fontSize: ff(12) },

  livePill: {
    backgroundColor: "#D73C3E",
    paddingHorizontal: fw(14),
    paddingVertical: fh(5),
    borderRadius: fw(14),
  },
  liveText: { color: "#fff", fontSize: ff(12) },

  // MODAL CARD
  modalCard: {
    flex: 1,
    marginTop: fh(10),
    marginBottom: fh(70),   // ⬅️ adds bottom breathing room
    marginHorizontal: fw(16),
    backgroundColor: "rgba(20,20,22,0.82)",
    borderRadius: fw(22),
    paddingHorizontal: fw(16),
    paddingTop: fh(16),
    overflow: "hidden",
  },

  timelineRail: {
    position: "absolute",
    left: fw(30),
    top: fh(16),
    bottom: 0,
    width: fw(3),
    backgroundColor: "#FFF",
    borderRadius: fw(2),
  },

  timelineItem: {
    flexDirection: "row",
    paddingBottom: fh(12),
  },

  cubeHolder: {
    width: fw(40),
    alignItems: "center",
    paddingTop: fh(4),
  },
  cubeIcon: { width: fw(20), height: fw(20), right: fw(5) },

  redDot: {
    width: fw(18),
    height: fw(18),
    borderRadius: fw(3),
    backgroundColor: "rgba(40,40,40,0.8)",
    borderWidth: fw(1),
    borderColor: "rgba(80,80,80,0.9)",
  },

  messageContainer: { flex: 1 },

  timeTextTop: {
    color: "#ccc",
    fontSize: ff(10),
    marginBottom: fh(4),
    marginLeft: fw(4),
  },

  chatBubble: {
    flexDirection: "column",   // ← IMPORTANT
    backgroundColor: "rgba(45,45,45,0.9)",
    borderRadius: fw(14),
    paddingHorizontal: fw(14),
    paddingVertical: fh(10),
    overflow: "hidden",
  },

  leftAccent: {
    width: fw(4),
    backgroundColor: "#91c92bff",
    borderRadius: fw(4),
    marginRight: fw(10),
  },
  timeInsideBubble: {
    color: "#b5b5b5",
    fontSize: ff(10),
    marginBottom: fh(6),
  },


  chatText: {
    fontSize: ff(14),
    color: "#fff",
    lineHeight: fh(20),
  },

  entryImage: {
    width: "100%",
    height: fh(120),
    borderRadius: fw(12),
    marginTop: fh(8),
  },

  shareButtonWrapper: {
    position: "absolute",
    bottom: fh(35),
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 99,
  },

  shareButton: {
    width: fw(100),
    height: fh(30),
    borderRadius: fw(10),
    overflow: "hidden",
  },

  shareGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: fw(10),
    paddingHorizontal: fw(12),
  },

  shareText: {
    color: "#fff",
    fontSize: ff(14),
    marginLeft: fw(6),
  },

  titleContainer: {
    flex: 1,             // let title expand but NOT push live button
    marginHorizontal: fw(10),
  },

  // headerTitle: {
  //   color: "#fff",
  //   fontSize: ff(18),
  //   lineHeight: fh(22),
  //   flexWrap: "wrap",      // allow wrapping
  //   flexShrink: 1,         // prevents pushing the LIVE button
  // },

  headerTitle: {
    color: "#fff",
    fontSize: ff(18),
    lineHeight: ff(28),
    textAlignVertical: 'center',
    includeFontPadding: false,
    flexWrap: "wrap",      // allow wrapping
    flexShrink: 1,
  },

});

export default LiveUpdatesScreen;