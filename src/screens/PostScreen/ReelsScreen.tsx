import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  BackHandler,
  Platform,
  Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
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
import { MMKV } from "react-native-mmkv";
import { SafeAreaView } from "react-native-safe-area-context";

const mmkv = new MMKV();

const ReelsScreen = () => {
  const hasResetRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    const lastSession = mmkv.getNumber("lastSession") ?? 0;
    const isColdStart = now - lastSession > 10 * 1000;

    if (isColdStart && !hasResetRef.current) {
      hasResetRef.current = true;
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

  // ✅ Layout State
  const [screenHeight, setScreenHeight] = useState(0);
  const [topBarHeight, setTopBarHeight] = useState(0);

  // ✅ Calculate container height dynamically
  const containerHeight = Math.max(
    screenHeight - topBarHeight - fh(14),
    Dimensions.get("window").height * 0.9
  );


  useEffect(() => {
    const now = global.performance?.now?.() ?? Date.now();
    console.log(`📌 ${route.name} mounted at`, now);
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (activeTab === "latest") {
        navigation.navigate("ArticleScreen" as never);
        return true;
      }
      setActiveTab("latest");
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => subscription.remove();
  }, [activeTab, navigation, setActiveTab]);

  const {
    videos,
    fetchVideos,
    videosByCategory,
    loadMoreVideos,
    lastViewedIndexByCategory,
    setLastViewedIndex,
  } = useVideosStore();

  const { videoId, fromExclusive } = route.params || {};

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
            () => loadMoreVideos(activeCategoryKey === "all" ? null : Number(activeCategoryKey)),
            300
          );
        }
        if (activeCategoryKey === "all" && videos.length === 0) {
          await debounceFetch(() => fetchVideos(), 300);
        }
      } finally {
        setIsFetching(false);
      }
    };
    ensureLoaded();
  }, [activeTab, videosByCategory, videos, loadMoreVideos, fetchVideos]);

  const localizedTabs = useMemo(() => {
    const baseTabs = tabs.map((tab) => {
      if (tab.key === "state") {
        return { ...tab, label: String(data.village_name) };
      }
      return tab;
    });

    const sidebarTab = baseTabs.find((t) => t.key === "sidebar");
    const latestTab = baseTabs.find((t) => t.key === "latest");
    const selectedTabs = baseTabs.filter((t) => selectedCategories.includes(t.key));

    return [
      ...(sidebarTab ? [sidebarTab] : []),
      ...(latestTab ? [latestTab] : []),
      ...selectedTabs,
    ];
  }, [tabs, data.village_name, selectedCategories]);

  const filteredVideos = useMemo(() => {
    const activeCategoryKey = activeTab === "latest" || activeTab === "state" ? "all" : String(activeTab);
    const storeKey = `${activeCategoryKey}`;
    const fromCache = videosByCategory?.[storeKey]?.items ?? [];
    if (fromCache.length === 0 && (activeCategoryKey === "all")) return videos;
    return fromCache;
  }, [videosByCategory, activeTab, videos]);

  const loading = filteredVideos.length === 0;
  const activeCategoryKey = activeTab === "latest" || activeTab === "state" ? "all" : String(activeTab);
  const storeKey = `${activeCategoryKey}`;
  const [initialIndex, setInitialIndex] = useState(0);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchVideos();
    } catch (err) {
      console.error("❌ Error refreshing reels:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!fromExclusive || !videoId) {
      const saved = lastViewedIndexByCategory?.[storeKey];
      setInitialIndex(typeof saved === "number" ? saved : 0);
      return;
    }

    if (filteredVideos.length === 0) return;

    const idx = filteredVideos.findIndex((v: any) => String(v.video_id) === String(videoId));
    if (idx >= 0) {
      setInitialIndex(idx);
    } else {
      const timer = setTimeout(() => {
        const refreshed = useVideosStore.getState().videos;
        const retryIdx = refreshed.findIndex((v: any) => String(v.video_id) === String(videoId));
        if (retryIdx >= 0) {
          setInitialIndex(retryIdx);
        } else {
          setInitialIndex(0);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [filteredVideos, videoId, fromExclusive, storeKey, lastViewedIndexByCategory]);

  const handleCategoryTap = (categoryId: number) => {
    const catKey = String(categoryId);
    setActiveTab(catKey);
    if (!selectedCategories.includes(catKey)) {
      setSelectedCategories([...selectedCategories, catKey]);
    }
  };

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setScreenHeight(e.nativeEvent.layout.height)}>
      <SafeAreaView style={styles.safeContainer} edges={['bottom']}>

        <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />

        {/* 🔹 TopBar Overlay */}

        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <TopBarContainer
          backgroundColor={Colors.darkpurple}
          style={[styles.topBarWrap,
          { paddingTop: Platform.OS === "ios" ? insets.top : fh(10) }
          ]}
          onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height)}
        >
          <TopBar
            tabs={localizedTabs}
            activeTab={activeTab}
            onTabPress={(key) => {
              if (key === "sidebar") setSidebarVisible(true);
              else setActiveTab(key);
            }}
            labelStyle={{ color: "#ccc" }}
            activeLabelStyle={{
              color: Colors.topbarActiveLabel,
              fontWeight: "700",
            }}
          />
        </TopBarContainer>


        {/* Loader */}
        {isFetching && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.lavenderPurple} />
            <Text style={{ color: "#fff", marginTop: fh(10) }}>{t("loading_reels")}</Text>
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

        {/* Reels List */}
        {!loading && filteredVideos.length > 0 && containerHeight > 0 && (
          <View style={{ height: containerHeight, marginTop: topBarHeight, overflow: 'hidden' }}>
            <Reels
              key={storeKey}
              videos={filteredVideos}
              initialIndex={initialIndex >= 0 ? initialIndex : 0}
              onIndexChange={(idx) => setLastViewedIndex(storeKey, idx)}
              onNearEnd={() => {
                const categoryForApi = activeCategoryKey === "all" ? null : Number(activeCategoryKey);
                loadMoreVideos(categoryForApi);
              }}
              onPressCategory={handleCategoryTap}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              containerHeight={containerHeight}
            />
          </View>
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
              prev.includes(cat.key) ? prev.filter((c) => c !== cat.key) : [...prev, cat.key]
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
};

export default ReelsScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: { flex: 1, backgroundColor: "#000" },
  topBarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
