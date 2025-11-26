import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Text,
  Platform,
  TouchableOpacity,
  BackHandler,
  useWindowDimensions,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import Video from "react-native-video";
import NetInfo from "@react-native-community/netinfo";
import { MMKV } from "react-native-mmkv";
import { FlashList } from "@shopify/flash-list";

// Components
import SidebarPanel from "../Sidebar/SidebarPanel";
import InteractionsRow from "../../components/InteractionRow";
import TopBar from "../../components/TopBar";
import TopBarContainer from "../../components/layout/TopBarContainer";
import BuzzShareModal from "../../components/share/buzz/BuzzShareModal";
import MagazineShareModal from "../../components/share/magazine/MagazineShareModal";
import CommentModal from "../../components/CommentModal";
import BuzzShimmer from "../../components/shimmers/BuzzShimmer";

// Context & Stores
import { useTheme } from "../../context/ThemeContext";
import { useBuzzStore } from "../../../utils/store/useBuzzStore";
import { useMagazinesStore, useDailyWrapsStore } from "../../../utils/store";
import { useOnboarding } from "../../context/OnboardingContext";
import { useContentTabs } from "../../hooks/useContentTabs";
import { prefetchImages } from "../../../utils/prefetchImages";

// Utils
import { fw, fh } from "../../../utils/responsive";
import { BOTTOMBAR_HEIGHT } from "../../constants/layout"; // Ensure this is accurate (e.g. 60 or 80)

const mmkv = new MMKV();

// Helper: Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: Feed Builder
function buildMixedFeed(buzz: any[], magazines: any[], wraps: any[]) {
  const feed: any[] = [];
  let buzzIndex = 0, magIndex = 0, wrapIndex = 0;
  for (let i = 0; i < (buzz?.length || 0); i++) {
    feed.push(buzz[buzzIndex++]);
    if ((i + 1) % 3 === 0 && magazines[magIndex]) feed.push(magazines[magIndex++]);
    if ((i + 1) % 5 === 0 && wraps[wrapIndex]) feed.push(wraps[wrapIndex++]);
  }
  return feed;
}

const BuzzScreen = () => {
  // --- HOOKS & DIMENSIONS ---
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const safeArea = useSafeAreaInsets();

  const REAL_TOP_INSET = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, StatusBar.currentHeight || 0),
  });

  const { Colors, barStyle } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const isFocused = useIsFocused();

  // --- STATE ---
  const [hasReset, setHasReset] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const CONTENT_HEIGHT = SCREEN_H - topBarHeight;
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0]));
  const [speedMbps, setSpeedMbps] = useState<number | null>(null);
  const [pagerEnabled, setPagerEnabled] = useState(true);
  const [catLoadingBuzz, setCatLoadingBuzz] = useState(false);

  // Refs
  const listRef = useRef<FlatList<any>>(null);
  const isLoadingMoreBuzzRef = useRef(false);

  // Stores
  const { data, getLangCode } = useOnboarding();
  const lang = getLangCode();
  const { tabs, categories, activeTab, setActiveTab, selectedCategories, setSelectedCategories } = useContentTabs();
  const { buzzContents, fetchBuzzContents, loadMoreBuzz, buzzHasMore, setLastViewedBuzzIndex, lastViewedBuzzIndex } = useBuzzStore();
  const { magazines, fetchMagazines } = useMagazinesStore();
  const { dailyWraps, fetchDailyWraps } = useDailyWrapsStore();

  // --- EFFECTS ---

  // Cold Start Reset
  useEffect(() => {
    const now = Date.now();
    const lastSession = mmkv.getNumber("lastSession") ?? 0;
    const isColdStart = now - lastSession > 10 * 1000;
    if (isColdStart && !hasReset) {
      setHasReset(true);
      useBuzzStore.setState({ lastViewedBuzzIndex: 0 });
    }
    mmkv.set("lastSession", now);
  }, []);

  // Initial Fetch
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchBuzzContents(), fetchMagazines(), fetchDailyWraps()]);
      setLoading(false);
    })();
  }, []);

  // Network Speed
  useEffect(() => {
    NetInfo.fetch().then(state => {
      const dl: any = (state as any)?.details?.downlink;
      if (typeof dl === "number" && dl > 0) setSpeedMbps(dl);
    });
  }, []);

  // Back Handler
  useEffect(() => {
    const backAction = () => {
      if (activeTab === "latest") {
        navigation.navigate("ArticleScreen");
        return true;
      }
      setActiveTab("latest");
      return true;

    };
    const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => sub.remove();
  }, [activeTab]);

  // Tab Change Fetch
  const getActiveCategoryId = useCallback(() => {
    if (activeTab === "latest") return null;
    const cat = categories.find((c) => String(c.key) === String(activeTab));
    return cat ? Number(cat.category_id) : null;
  }, [activeTab, categories]);

  useEffect(() => {
    if (!categories?.length) return;
    const catId = getActiveCategoryId();
    useBuzzStore.setState({ buzzContents: [], buzzCursor: null, buzzHasMore: true });
    setCatLoadingBuzz(true);
    fetchBuzzContents(catId, true).finally(() => setCatLoadingBuzz(false));
  }, [activeTab]);

  // --- DATA PREP ---
  const selectBestVariant = useCallback((media: any, mbps?: number | null) => {
    const variants = media?.variants;
    if (!variants) return null;
    let tier: "480p" | "720p" | "1080p" = "720p";
    if (typeof mbps === "number") {
      if (mbps < 1.5) tier = "480p";
      else if (mbps <= 3) tier = "720p";
      else tier = "1080p";
    }
    return variants[`hls_${tier}`] || variants[tier] || variants["720p"] || null;
  }, []);

  const mixedFeed = useMemo(() => {
    const langCode = getLangCode();
    const today = new Date().toISOString().split("T")[0];

    const buzzNormalized = (buzzContents || []).map((b) => ({
      id: `buzz-${b.buzz_id}`,
      type: "buzz" as const,
      mediaUrl: langCode === "te" ? b.media_te?.url || null : b.media_en?.url || null,
      buzz_id: b.buzz_id,
      category: b.Category,
      stats: b.stats || {}
    }));

    const magsNormalized = (magazines || []).map(m => ({
      id: `mag-${m.magazine_id}`, type: "magazine" as const,
      pages: (langCode === "te" ? m.pages_te : m.pages_en) || [],
      magazine_id: m.magazine_id,
      stats: m.stats || {}
    }));

    const wrapsNormalized = (dailyWraps || []).filter(w => w?.published_at?.startsWith(today)).map(w => ({
      id: `wrap-${w.wrap_id}`, type: "wrap" as const,
      media: langCode === "te" ? w.media_te : w.media_en,
      wrap_id: w.wrap_id,
      stats: w.stats || {}
    }));

    return buildMixedFeed(buzzNormalized, magsNormalized, wrapsNormalized);
  }, [buzzContents, magazines, dailyWraps, getLangCode]);

  // Pagination Logic
  useEffect(() => {
    if (mixedFeed.length > 0 && isFocused) {
      const savedIndex = useBuzzStore.getState().lastViewedBuzzIndex ?? 0;
      setCurrentPage(savedIndex);
      // Wait for layout to happen before setting page
      setTimeout(() => {
        if (listRef.current) {
          listRef.current?.scrollToIndex({
            index: savedIndex,
            animated: false,
            viewPosition: 0,
          });
        }
      }, 20);
    }
  }, [mixedFeed.length, isFocused]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,  // Load earlier
  }).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<{ index?: number }> }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0]?.index ?? 0;

      setCurrentPage(newIndex);
      setLoadedPages(prev => {
        const next = new Set(prev);
        next.add(newIndex);
        // Preload more adjacent items for smoother scrolling
        if (newIndex > 0) {
          next.add(newIndex - 1);
          if (newIndex > 1) next.add(newIndex - 2);
        }
        if (newIndex < mixedFeed.length - 1) {
          next.add(newIndex + 1);
          if (newIndex < mixedFeed.length - 2) next.add(newIndex + 2);
        }
        return next;
      });
      useBuzzStore.getState().setLastViewedBuzzIndex(newIndex);

      // Load More Logic
      if (buzzHasMore && !isLoadingMoreBuzzRef.current && newIndex > mixedFeed.length - 4) {
        isLoadingMoreBuzzRef.current = true;
        loadMoreBuzz(getActiveCategoryId()).finally(() => { isLoadingMoreBuzzRef.current = false; });
      }
    }
  }, [mixedFeed.length, buzzHasMore, getActiveCategoryId]);

  // --- SUB-COMPONENTS (Refactored for Layout) ---

  const WrapVideoItem = ({ item, isActive, setPagerEnabled }: any) => {
    const [paused, setPaused] = useState(false);
    const uri = selectBestVariant(item.media, speedMbps);

    // We use the MAX_CONTENT_HEIGHT to ensure it fits between bars
    return (
      <TouchableWithoutFeedback onPress={() => setPaused(!paused)}>
        <View style={[styles.contentContainer, { height: CONTENT_HEIGHT }]}>
          {uri ? (
            <Video
              source={{ uri }}
              style={styles.mediaContent} // width: 100%, height: 100%
              resizeMode="contain" // Fits entire video inside the box
              paused={!isActive || paused}
              repeat
              onLoad={() => setPagerEnabled(true)}
            />
          ) : <Text style={styles.errorText}>Video Unavailable</Text>}

          {/* Gradient overlay only at the bottom for text readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={styles.bottomGradient}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const ImageItem = ({ url }: { url: string }) => (
    <View style={[styles.contentContainer, { height: CONTENT_HEIGHT }]}>
      <FastImage
        source={{ uri: url }}
        style={[
          styles.mediaContent,
        ]}
        resizeMode={FastImage.resizeMode.contain} // Crucial for "fitting"
      />
    </View>
  );

  const MagazinePagesItem = ({ item }: any) => (
    <View style={[styles.contentContainer, { height: CONTENT_HEIGHT }]}>
      <FlashList
        data={item.pages}
        horizontal
        pagingEnabled
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item: p }) => (
          <View style={{ width: SCREEN_W, height: CONTENT_HEIGHT }}>
            <FastImage
              source={{ uri: p.url }}
              style={[
                styles.mediaContent,
              ]}
              resizeMode={FastImage.resizeMode.contain}
            />
          </View>
        )}
      />
    </View>
  );

  // --- RENDER ITEM ---
  const renderItem = (item: any, index: number) => {
    if (!loadedPages.has(index)) return <BuzzShimmer />;
    const isActive = currentPage === index && isFocused;

    // normalize stats
    const stats = {
      likes_count: Number(item.stats?.likes_count || 0),
      comments_count: Number(item.stats?.comments_count || 0),
      shares_count: Number(item.stats?.shares_count || 0),
      dislikes_count: Number(item.stats?.dislikes_count || 0),
      saves_count: Number(item.stats?.saves_count || 0),
      views_count: Number(item.stats?.views_count || 0),
    };

    return (
      <View style={styles.slideContainer}>
        {/* 1. Content Centered in the "Safe Zone" */}
        <View
          style={{
            height: SCREEN_H,
            width: SCREEN_W,
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >

          {item.type === "wrap" ? (
            <WrapVideoItem item={item} isActive={isActive} setPagerEnabled={setPagerEnabled} />
          ) : item.type === "magazine" ? (
            <MagazinePagesItem item={item} isActive={isActive} />
          ) : item.mediaUrl ? (
            <ImageItem url={item.mediaUrl} />
          ) : (
            <View style={styles.errorBox}><Text style={styles.errorText}>No Media</Text></View>
          )}
        </View>

        {/* 2. Interactions Row - FIXED POSITION */}
        {/* Placed absolutely relative to the Slide, but calculated from the bottom safe area */}
        {item.type !== "wrap" && (
          <View style={[styles.interactionOverlay, { bottom: insets.bottom + fh(30) }]}>
            <InteractionsRow
              stats={stats}
              tintColor={Colors.blackcolor}
              backgroundColor="#49425B33"
              deviceId={data.device_id}
              contentType={item.type === "magazine" ? "magazines" : "buzz"}
              contentId={item.wrap_id || item.magazine_id || item.buzz_id}
              onShare={() => setShareVisible(true)}
              onComment={() => {
                setSelectedContentId(item.buzz_id || item.magazine_id);
                setCommentVisible(true);
              }}
              containerStyle={styles.interactionsContainer}
            />
          </View>
        )}
      </View>
    );
  };

  const localizedTabs = useMemo(() => {
    if (!tabs || tabs.length === 0) return [];
    const specialTabs = ["breaking", "trending", "exclusive", "state"];
    return tabs.filter(t => !specialTabs.includes(t.key));
  }, [tabs]);

  return (
    // <View style={styles.root}>
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={barStyle} />


      {mixedFeed.length > 0 ? (
        <FlatList
          ref={listRef}
          data={mixedFeed}
          renderItem={({ item, index }) => (
            <View style={{ height: CONTENT_HEIGHT, width: SCREEN_W }}>
              {renderItem(item, index)}
            </View>
          )}
          keyExtractor={(item) => item.id}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={CONTENT_HEIGHT}
          snapToAlignment="start"
          disableIntervalMomentum={true}
          showsVerticalScrollIndicator={false}
          bounces={false}
          removeClippedSubviews={true}
          windowSize={3}
          maxToRenderPerBatch={2}
          updateCellsBatchingPeriod={50}
          initialNumToRender={2}
          getItemLayout={(_, index) => ({
            length: CONTENT_HEIGHT,
            offset: CONTENT_HEIGHT * index,
            index,
          })}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          scrollEnabled={pagerEnabled}
        />
      ) : (
        <View style={styles.centerLoader}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.errorText}>No Content</Text>}
        </View>
      )}

      {/* TOP GRADIENT OVERLAY */}
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "transparent"]}
        style={[styles.topGradient, { height: fh(40) }]}
        pointerEvents="none"
      />

      {/* TOP BAR - Absolute on top */}
      <TopBarContainer
        backgroundColor={Colors.darkpurple}
        onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height)}
      >
        <TopBar
          tabs={localizedTabs}
          activeTab={activeTab}
          onTabPress={(key) => key === "sidebar" ? setSidebarVisible(true) : setActiveTab(key)}
          labelStyle={{ color: "#888" }}
          activeLabelStyle={{ color: Colors.topbarActiveLabel }}
        />
      </TopBarContainer>

      {/* MODALS */}
      <SidebarPanel
        visible={isSidebarVisible}
        onClose={() => setSidebarVisible(false)}
        categories={categories}
        selectedCategories={selectedCategories}
        activeCategoryKey={activeTab}
        onCategoryPress={() => { }}
      />
      <CommentModal visible={commentVisible} onClose={() => setCommentVisible(false)} contentId={selectedContentId || 0} contentType="buzz" />
      {/* Share Modals logic... */}
      {/* </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000", // Matte black background
  },
  pager: {
    flex: 1,
    backgroundColor: "#000",
  },
  pagerPage: {
    flex: 1,
    // No height calculations here, let PagerView fill the root
  },
  slideContainer: {
    flex: 1,
    backgroundColor: "#000",
    // No logic here, just a container
  },
  contentContainer: {
    width: "100%",
    // Height is injected via inline styles for responsiveness
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mediaContent: {
    width: "100%",
    height: "100%",
  },
  interactionOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  interactionsContainer: {
    width: fw(280), // Consistent width
  },
  topBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: fh(150),
    zIndex: 5,
  },
  centerLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
  }
});

export default BuzzScreen;