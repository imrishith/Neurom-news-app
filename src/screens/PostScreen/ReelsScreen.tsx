import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  ScrollView, RefreshControl, BackHandler
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Reels from "./Elements/Reels";
import TopBar from "../../components/TopBar";
import TopBarContainer from "../../components/layout/TopBarContainer";
import SidebarPanel from "../Sidebar/SidebarPanel";
import { useContentTabs } from "../../hooks/useContentTabs";
import { useOnboarding } from "../../context/OnboardingContext";
import { useTheme } from "../../context/ThemeContext";
import { fh } from "../../../utils/responsive";
import { useVideosStore } from "../../../utils/store/useVideosStore";
import { debounceFetch } from "../../../utils/debounceFetch";
import { useAppRefresh } from "../../../utils/useAppRefresh";
import { useNavigation } from "@react-navigation/native";
import { performance } from "react-native-performance";
import { MMKV } from "react-native-mmkv";
const mmkv = new MMKV();


const ReelsScreen = () => {

  const hasResetRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    const lastSession = mmkv.getNumber("lastSession") ?? 0;
    const isColdStart = now - lastSession > 10 * 1000; // 10s gap → terminated or killed

    if (isColdStart && !hasResetRef.current) {

      hasResetRef.current = true;

      // 👇 Reset logic specific to each screen
      useVideosStore.setState({
        lastViewedIndexByCategory: {},
        lastViewedIndex: 0,
      });
    }

    mmkv.set("lastSession", now);
  }, []);


  const insets = useSafeAreaInsets();
  const { Colors, barStyle } = useTheme();
  const { data, t } = useOnboarding();
  const [refreshing, setRefreshing] = useState(false);
  const { tabs, categories, activeTab, setActiveTab, selectedCategories, setSelectedCategories } = useContentTabs();

  const [isFetching, setIsFetching] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const navigation = useNavigation();
  const route = useRoute<any>();

  useEffect(() => {
    const now = global.performance?.now?.() ?? Date.now();
      console.log(`📌 ${route.name} mounted at`, now);
  }, []);


  // backhandler done by rishith
 useEffect(() => {
  const backAction = () => {
    // 1️⃣ If already on Latest tab → Go to ArticleScreen
    if (activeTab === "latest") {
      navigation.navigate("ArticleScreen");
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



  // ✅ Keep track of selected categories

  // Zustand store
  const {
    videos,
    fetchVideos,
    lastFetchedVideosAt,
    videosByCategory,
    loadMoreVideos,
    lastViewedIndexByCategory,
    setLastViewedIndex,
  } = useVideosStore ();

  const { videoId, fromExclusive } = route.params || {};
  // Fetch initial page for current category when needed  
  useEffect(() => {
    const activeCategoryKey = activeTab === "latest" || activeTab === "state" ? "all" : String(activeTab);
    const storeKey = `${activeCategoryKey}`;

    const currentCache = videosByCategory?.[storeKey];
    const hasItems = currentCache && currentCache.items && currentCache.items.length > 0;

    const ensureLoaded = async () => {
      setIsFetching(true);
      try {
        if (!hasItems) {
          await debounceFetch(
            () =>
              loadMoreVideos(
                activeCategoryKey === "all" ? null : Number(activeCategoryKey)
              ),
            300
          );
        }
        // Seed legacy top-level 'videos' for 'all' if still empty
        if (activeCategoryKey === "all" && videos.length === 0) {
          await debounceFetch(() => fetchVideos(), 300);
        }
      } finally {
        setIsFetching(false);
      }
    };

    ensureLoaded();
  }, [activeTab, videosByCategory, videos]);

  // moved below after filteredVideos is defined

  // ✅ Construct TopBar tabs with “+” beside Latest
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

    // ✅ Always show: Latest → Plus → State → Selected
    const orderedTabs = [
      ...(sidebarTab ? [sidebarTab] : []),
      ...(latestTab ? [latestTab] : []),

      ...selectedTabs,
    ];

    return orderedTabs;
  }, [tabs, data.village_name, selectedCategories]);

  // ✅ Filter by category (latest/state => all, else filter)
  const filteredVideos = useMemo(() => {
    const activeCategoryKey = activeTab === "latest" || activeTab === "state" ? "all" : String(activeTab);
    const storeKey = `${activeCategoryKey}`;
    const fromCache = videosByCategory?.[storeKey]?.items ?? [];
    // Fallback to legacy top-level videos for latest/state
    if (fromCache.length === 0 && (activeCategoryKey === "all")) return videos;
    return fromCache;
  }, [videosByCategory, data.language_code, activeTab, videos]);

  const loading = filteredVideos.length === 0;

  const activeCategoryKey = activeTab === "latest" || activeTab === "state" ? "all" : String(activeTab);
  const storeKey = `${activeCategoryKey}`;

  // ✅ Keep local state for index
  const [initialIndex, setInitialIndex] = useState(0);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await fetchVideos(); // or fetchVideos(true) to skip cache
    } catch (err) {
      console.error("❌ Error refreshing reels:", err);
    } finally {
      setRefreshing(false);
    }
  };


  // ✅ Watch for videoId or store updates
  useEffect(() => {
    if (!fromExclusive || !videoId) {
      // normal case — restore last viewed
      const saved = lastViewedIndexByCategory?.[storeKey];
      setInitialIndex(typeof saved === "number" ? saved : 0);

      return;
    }

    // when coming from Exclusive
    if (filteredVideos.length === 0) {

      return;
    }

    const idx = filteredVideos.findIndex(
      (v: any) => String(v.video_id) === String(videoId)
    );


    if (idx >= 0) {

      setInitialIndex(idx);
    } else {

      // retry once after short delay (store might not have synced yet)
      const timer = setTimeout(() => {
        const refreshed = useVideosStore.getState().videos;
        const retryIdx = refreshed.findIndex(
          (v: any) => String(v.video_id) === String(videoId)
        );
        if (retryIdx >= 0) {

          setInitialIndex(retryIdx);
        } else {
          console.warn("❌ Still not found, fallback to 0");
          setInitialIndex(0);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [filteredVideos, videoId, fromExclusive, storeKey, lastViewedIndexByCategory]);


  const handleCategoryTap = (categoryId: number) => {
    const catKey = String(categoryId);

    // 1️⃣ Highlight the tab
    setActiveTab(catKey);

    // 2️⃣ Mark selected in Sidebar
    if (!selectedCategories.includes(catKey)) {
      setSelectedCategories([...selectedCategories, catKey]);
    }


  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />

      {/* 🔹 TopBar */}
      <View
        style={[
          // styles.topBarWrap, 
          { paddingTop: insets.top }]}>
        <LinearGradient
          colors={["rgba(0,0,0,5)", "rgba(0,0,0,0)"]}
          style={StyleSheet.absoluteFillObject}
        />


        <TopBarContainer backgroundColor={Colors.darkpurple}>
          <TopBar
            tabs={localizedTabs}
            activeTab={activeTab}
            onTabPress={(key) => {
              if (key === "sidebar") setSidebarVisible(true);
              else setActiveTab(key);
            }}
            labelStyle={{ color: "#888" }}
            activeLabelStyle={{
              color: Colors.topbarActiveLabel,
              fontWeight: "700",
            }}
          />
        </TopBarContainer>


      </View>

      {/* Loader */}
      {isFetching && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.lavenderPurple} />
          <Text style={{ color: "#fff", marginTop: fh(10) }}>
            {t("loading_reels")}
          </Text>
        </View>
      )}

      {/* Empty State */}
      {!isFetching && filteredVideos.length === 0 && (
        <View style={styles.loader}>
          <Text style={{ color: "#fff", fontSize: 14, marginTop: fh(10) }}>
            No Reels Available
          </Text>
        </View>
      )}

      {/* Reels */}
      {!loading && filteredVideos.length > 0 && (
        <Reels
          key={storeKey}
          videos={filteredVideos}
          initialIndex={initialIndex >= 0 ? initialIndex : 0}
          onIndexChange={(idx) => setLastViewedIndex(storeKey, idx)}
          onNearEnd={() => {
            // Load next page when within last 3 items
            const categoryForApi = activeCategoryKey === "all" ? null : Number(activeCategoryKey);
            loadMoreVideos(categoryForApi);

          }}
          onPressCategory={handleCategoryTap}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Sidebar Panel */}
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
    </View>
  );
};

export default ReelsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBarWrap: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, marginTop: fh(10),
    marginBottom: fh(-20),
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
