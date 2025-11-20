// screens/Magazines/ExploreMosaicScreen.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, LayoutChangeEvent, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, BackHandler } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import GradientScreen from "../../components/GradientScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/TopBar";
import { useTheme } from "../../context/ThemeContext";
import { fw, fh, ff } from "../../../utils/responsive";
import SidebarPanel from "../Sidebar/SidebarPanel";
import { useMagazinesStore } from "../../../utils/store/useMagazinesStore";
import { useOnboarding } from "../../context/OnboardingContext";
// Removed PDF viewer – now using image pages
import MagazineViewer from "./Elements/MagazineViewer";
import { useContentTabs } from "../../hooks/useContentTabs";
import InteractionsRow from "../../components/InteractionRow";
import ShareModal from "../../components/ShareModal";
import MagazineShareModal from "../../components/share/magazine/MagazineShareModal";
import { shareToWhatsApp } from "../../../utils/shareUtils";
import Colors from "../../constants/colors";
import TopBarContainer from "../../components/layout/TopBarContainer";
import { useAppRefresh } from "../../../utils/useAppRefresh";
import { MMKV } from "react-native-mmkv";
import { performance } from "react-native-performance";
import MosaicShimmer from "../../components/shimmers/MosaicShimmer";


const mmkv = new MMKV();


type Magazine = {
  magazine_id: number;
  title: string;
  title_en?: string;
  title_te?: string;
  media?: {
    url?: string;
    cover?: { url?: string; type: string; format: string };
    width?: number;
    height?: number;
    type: string;
    format: string;
  };

  media_en?: { url?: string; type?: string; format?: string };
  media_te?: { url?: string; type?: string; format?: string };
  pages_en?: Array<{ url: string; page_number: number }>;
  pages_te?: Array<{ url: string; page_number: number }>;
  category_id: number;
  Category?: { name_en: string; name_te?: string };
  stats?: any;
};

const GAP = fw(10);
const PAD_H = fw(16);

const ExploreMosaicScreen = () => {

  const hasResetRef = React.useRef(false);
  const [isShareVisible, setShareVisible] = useState(false);
   const navigation = useNavigation();
   const route = useRoute<any>();

  useEffect(() => {
    const now = global.performance?.now?.() ?? Date.now();
      console.log(`📌 ${route.name} mounted at`, now);
  }, []);


  useEffect(() => {
    const now = Date.now();
    const lastSession = mmkv.getNumber("lastSession") ?? 0;
    const isColdStart = now - lastSession > 10 * 1000; // 10s gap → terminated app

    if (isColdStart && !hasResetRef.current) {

      hasResetRef.current = true;

      // 🧹 Reset relevant magazine view state in store
      useMagazinesStore.setState({
        lastViewedMagazineIndex: 0, // optional if you track it
        magazines: [], // clear cache if needed
      });
    }

    mmkv.set("lastSession", now);
  }, []);


  const [containerW, setContainerW] = useState(0);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  // currentPage/totalPages no longer needed with image viewer
  const { Colors, barStyle } = useTheme();
  const [refreshing, setRefreshing] = useState(false);


  const { magazines, fetchMagazines, lastFetchedMagazinesAt } = useMagazinesStore();
  const [loading, setLoading] = useState(true);

  const { t, getFont, data, getLangCode } = useOnboarding();
  const lang = getLangCode();
  const { tabs = [], categories = [], activeTab, setActiveTab, selectedCategories = [], setSelectedCategories } = useContentTabs();

  // 🔥 Prefetch magazine cover images & first 2 pages for each magazine
useEffect(() => {
  if (!magazines || magazines.length === 0) return;

  const urls: string[] = [];

  magazines.forEach((m: any) => {
    // Cover image (primary)
    const cover =
      m?.media_en?.url ||
      m?.media_te?.url ||
      m?.media?.url;

    if (cover) urls.push(cover);

    // Prefetch only first 2 pages for speed
    const pages =
      (lang === "te" ? m.pages_te : m.pages_en) || [];

    if (pages[0]?.url) urls.push(pages[0].url);
    if (pages[1]?.url) urls.push(pages[1].url);
  });

  // Limit to top 12 for safety
  const unique = Array.from(new Set(urls)).slice(0, 12);

  FastImage.preload(unique.map((u) => ({ uri: u })));
}, [magazines, lang]);


  const localizedTabs = useMemo(() => {
    const baseTabs = tabs.map((tab) => {
      if (tab.key === "state") {
        return { ...tab, label: String(data.village_name) };
      }
      return tab;
    });

    const sidebarTab = baseTabs.find((t) => t.key === "sidebar");
    const latestTab = baseTabs.find((t) => t.key === "latest");
    const stateTab = baseTabs.find((t) => t.key === "state");

    const selectedTabs = baseTabs.filter((t) =>
      selectedCategories.includes(t.key)
    );

    return [
      ...(sidebarTab ? [sidebarTab] : []),
      ...(latestTab ? [latestTab] : []),

      ...selectedTabs,
    ];
  }, [tabs, data.village_name, selectedCategories]);
  const onLayout = (e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width);
  const contentW = Math.max(0, containerW - PAD_H * 2);
  const colW = (contentW - GAP) / 2;

  
     // backhandler done by rishith
       useEffect(() => {
  const backAction = () => {
    // 1️⃣ If already on Latest tab → Go to ArticleScreen
    if (activeTab === "latest") {
      navigation.navigate("HomeScreen");
      return true; // stop global handler
    }

    // 2️⃣ If inside any category → switch back to Latest tab
    setActiveTab("latest");
    return true; // prevent global back action
  };

  const subscription = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => subscription.remove();
}, [activeTab]);


  const getActiveCategoryId = useCallback(() => {
    if (activeTab === "latest") return null;
    if (!categories || categories.length === 0) return null;
    const cat = categories.find((c: any) => String(c.key) === String(activeTab));
    return cat ? Number(cat.category_id) : null;
  }, [activeTab, categories]);

  useEffect(() => {
    const categoryId = getActiveCategoryId();

    if (lastFetchedMagazinesAt && Date.now() - lastFetchedMagazinesAt < 10000) {
      setLoading(false);
      return;
    }

    fetchMagazines(categoryId ?? null).finally(() => setLoading(false));
  }, [activeTab, categories, lastFetchedMagazinesAt]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const categoryId = getActiveCategoryId();
      await fetchMagazines(categoryId ?? null);
    } catch (err) {
      console.error("❌ Magazine refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // 🔹 Auto refresh on app reopen
  useAppRefresh(() => {

    const categoryId = getActiveCategoryId();
    fetchMagazines(categoryId ?? null);
  });

  const posts =
    activeTab !== "latest"
      ? magazines.filter((m: any) => String(m.category_id) === String(activeTab))
      : magazines;

  const renderCard = (item: Magazine, w: number, h: number) => {

    const title =
      lang === "te" ? item.title_te : item.title_en || null;

    const imageUrl =
      lang === "te"
        ? item.media_te?.url || null
        : item.media_en?.url || null;

    return (
      <TouchableOpacity
        key={item.magazine_id}
        activeOpacity={0.9}
        onPress={() => setSelectedMagazine(item)}
        style={{ marginBottom: GAP }}
      >
        <View style={[styles.card, { width: w, height: h }]}>
          {imageUrl ? (
            <FastImage source={{ uri: imageUrl, priority: FastImage.priority.normal }} style={styles.cardImg} resizeMode={FastImage.resizeMode.cover} />
          ) : (
            <View style={[styles.cardImg, { backgroundColor: Colors.mediumGray }]} />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text
            style={[styles.cardTitle, { fontFamily: getFont("regular"), color: Colors.textcolor }]}
            numberOfLines={2}
          >
            {/* {item.title} */}
          </Text>
          <View style={styles.readBadge}>
            <Text style={[styles.readBadgeText, { fontFamily: getFont("semibold") }]}>
              {/* {t("read_pdf")} */}
              {title}
              {/* njksdncldnsovndsvnk jkl ih kjsdnjksdhfuisdhfndsljkn fskdnf bnjkb */}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <MosaicShimmer />
      </View>
    );
  }

  const heights = [fh(180), fh(220), fh(260), fh(200), fh(240), fh(280)];
  const leftItems = posts.filter((_, i) => i % 2 === 0);
  const rightItems = posts.filter((_, i) => i % 2 !== 0);

  return (
    <GradientScreen>
      <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />
      
        {selectedMagazine ? (
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <MagazineViewer
              pages={(lang === "te" ? selectedMagazine.pages_te : selectedMagazine.pages_en) || []}
              title={lang === "te" ? (selectedMagazine.title_te || selectedMagazine.title_en || "") : (selectedMagazine.title_en || selectedMagazine.title_te || "")}
              stats={selectedMagazine.stats}
              contentId={selectedMagazine.magazine_id}
              onClose={() => setSelectedMagazine(null)}
              onShare={() => setShareVisible(true)}
            />
          </View>
        ) : (
          <>
            {/* <View style={styles.topbarInner}>
              <TopBar
                tabs={localizedTabs}
                activeTab={activeTab}
                onTabPress={(key) => {
                  if (key === "sidebar") {
                    setSidebarVisible(true);
                  } else {
                    setActiveTab(key);
                  }
                }}

                activeLabelStyle={{
                  color: Colors.blackcolor, // ✅ active label black
                  fontWeight: "700",
                }}

              />
            </View> */}
            <TopBarContainer backgroundColor={Colors.darkpurple}>
              <TopBar
                tabs={localizedTabs}
                activeTab={activeTab}
                onTabPress={(key) => {
                  if (key === "sidebar") {
                    setSidebarVisible(true);
                  } else {
                    setActiveTab(key);
                  }
                }}
                labelStyle={{ color: "#888" }}
                activeLabelStyle={{
                  color: Colors.topbarActiveLabel,
                  fontWeight: "700",
                }}
              />
            </TopBarContainer>
            <ScrollView
              contentContainerStyle={styles.content}
              onLayout={onLayout}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={["#997DDF"]}
                  tintColor="#997DDF"
                  title="Refreshing..."
                  titleColor="#fff"
                />
              }
            >
              <View style={[styles.columnsRow, { gap: GAP }]}>
                <View style={{ width: colW }}>
                  {leftItems.map((m, i) => renderCard(m, colW, heights[i % heights.length]))}
                </View>
                <View style={{ width: colW }}>
                  {rightItems.map((m, i) =>
                    renderCard(m, colW, heights[(i + 2) % heights.length])
                  )}
                </View>
              </View>
            </ScrollView>

            <SidebarPanel
              visible={isSidebarVisible}
              onClose={() => setSidebarVisible(false)}
              categories={categories}
              selectedCategories={selectedCategories}
              activeCategoryKey={activeTab}
              onCategoryPress={(cat) => {
                setSelectedCategories((prev) =>
                  prev.includes(cat.key)
                    ? prev.filter((c) => c !== cat.key)
                    : [...prev, cat.key]
                );
              }}
            />

          </>
        )}
        <MagazineShareModal
          visible={isShareVisible}
          onClose={() => setShareVisible(false)}
          magazine={{
            magazine_id: selectedMagazine?.magazine_id,
            title: selectedMagazine?.title_en || selectedMagazine?.title_te,
            mediaUrl:
              selectedMagazine?.media_en?.url ||
              selectedMagazine?.media_te?.url ||
              selectedMagazine?.media?.url,
            category: selectedMagazine?.Category || selectedMagazine?.category,
          }}
        />
    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.deepPurple,
  },
  content: {
    paddingHorizontal: PAD_H,
    paddingTop: fh(18),
    paddingBottom: fh(100),
    backgroundColor: "transparent",
    marginTop: fh(30),
  },
  columnsRow: { flexDirection: "row", alignItems: "flex-start" },
  card: {
    borderRadius: fw(10),
    backgroundColor: Colors.deepPurple,
    overflow: "hidden",
    elevation: 3,
  },
  cardImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  cardTitle: {
    position: "absolute",
    left: fw(10),
    right: fw(10),
    bottom: fh(28),
    fontSize: ff(12),
    fontWeight: "600",
    color: "#fff",
  },
  readBadge: {
    position: "absolute",
    bottom: fh(6),
    alignSelf: "center", // ✅ centers horizontally within parent
    backgroundColor: Colors.lavenderPurple,
    paddingHorizontal: fw(8),
    paddingVertical: fh(2),
    borderRadius: fw(6),
    opacity: 0.8
  },
  readBadgeText: {
    color: "#fff",
    fontSize: ff(12),
    fontWeight: '700'

  },
  interactionsContainer: {
    position: "absolute",
    alignSelf: "center",
    bottom: fh(10),
    width: fw(277),
    zIndex: 10,
  },
  topbarInner: {
    marginTop: fh(10),
    marginBottom: fh(-20),
  },
});

export default ExploreMosaicScreen;
