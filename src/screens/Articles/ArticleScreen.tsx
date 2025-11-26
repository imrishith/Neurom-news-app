import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  RefreshControl,
  AppState,
  ToastAndroid,
  FlatList,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useArticlesStore } from "../../../utils/store/useArticlesStore";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { useContentTabs } from "../../hooks/useContentTabs";
import { useFocusEffect } from "@react-navigation/native";

import TopBar from "../../components/TopBar";
import TopBarContainer from "../../components/layout/TopBarContainer";
import ArticleTextModeShimmer from "../../components/shimmers/ArticleTextModeShimmer";
import ArticleTextMode from "./ArticleTextMode";
import ArticleAudioMode from "./ArticleAudioMode";

import CommentModal from "../../components/CommentModal";
import ReportModal from "../../components/ReportModal";
import SidebarPanel from "../Sidebar/SidebarPanel";
import ArticleShareModal from "../../components/share/article/ArticleShareModal";

import { fw, fh, ff, getTopInset } from "../../../utils/responsive";
import { prefetchImages } from "../../../utils/prefetchImages";

const { height: SCREEN_H } = Dimensions.get("window");
import { SafeAreaView } from "react-native-safe-area-context";
import TrackPlayer from "react-native-track-player";
import { useRoute } from "@react-navigation/native";


// ============================================================
// ARTICLE SCREEN
// ============================================================
const ArticleScreen = () => {
  const insets = useSafeAreaInsets();
  const SAFE_TOP = getTopInset();

  const route = useRoute();
  const { fromBreaking, fromTrending, articleId, fromExclusive, fromCategory, mode } = route.params || {};

  const {
    articles,
    fetchArticles,
    loadMoreArticles,
    hasMore,
    isFetching,
    isLoadingMore,
  } = useArticlesStore();

  const { Colors, barStyle } = useTheme();
  const { t, getFont, getLangCode, data } = useOnboarding();
  const { tabs, activeTab, setActiveTab } = useContentTabs();

  // const flashListRef = useRef<FlashList<any>>(null);
  const flatListRef = useRef<FlatList<any>>(null);

  const [topBarHeight, setTopBarHeight] = useState(0);
  const CONTENT_HEIGHT = SCREEN_H - topBarHeight;

  const [isTextMode, setIsTextMode] = useState(mode !== "audio");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  const filterTabsForTopBar = () => {
    const specialTabs = ["breaking", "trending", "exclusive"];

    // If user came from breaking → show ONLY breaking
    if (fromBreaking) {
      return tabs.filter(t => t.key === "breaking" || !specialTabs.includes(t.key));
    }

    // If user came from trending → show ONLY trending
    if (fromTrending) {
      return tabs.filter(t => t.key === "trending" || !specialTabs.includes(t.key));
    }

    // If user came from exclusive → show ONLY exclusive
    if (fromExclusive) {
      return tabs.filter(t => t.key === "exclusive" || !specialTabs.includes(t.key));
    }

    // Default → remove all special tabs on ArticleScreen
    return tabs.filter(t => !specialTabs.includes(t.key));
  };



  const scrollToArticle = (id) => {
    const index = posts.findIndex((p) => p.article_id === id);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: false });
      setCurrentIndex(index);
      setSelectedArticle(posts[index]);
    }
  };

  useEffect(() => {
    const init = async () => {
      let selectedTab = activeTab;
      if (fromBreaking) selectedTab = "breaking";
      if (fromTrending) selectedTab = "trending";
      if (fromExclusive) selectedTab = "exclusive";
      if (fromCategory) selectedTab = fromCategory;
      setActiveTab(selectedTab);
      const params = getApiParamsForTab(selectedTab);


      await fetchArticles(
        true,
        params.category_id,
        "state-articles",
        undefined,
        params.is_trending,
        params.is_breaking,
        params.is_exclusive
      );
      if (articleId) {
        setTimeout(() => {
          scrollToArticle(articleId);
          if (mode === "audio") {
            setIsTextMode(false);   // 👈 force audio mode
          }
        }, 10);
      }
    };

    init();
  }, []);


  useEffect(() => {
    if (activeTab === "latest") {
      console.log("currentIndex", currentIndex);
      useArticlesStore.getState().setLastViewedLatest(currentIndex);
    }
  }, [currentIndex]);


  // ============================================================
  // CLEANUP: Stop audio when navigating away
  // ============================================================
  useEffect(() => {
    return () => {
      // Stop audio when component unmounts (user navigates away)
      TrackPlayer.pause().catch(() => { });
      TrackPlayer.stop().catch(() => { });
      TrackPlayer.reset().catch(() => { });
    };
  }, []);

  // ============================================================
  // RESUME LOGIC
  // ============================================================
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && currentIndex === 0) {
        fetchArticles(false, undefined, undefined, undefined, undefined, undefined, true); // silent refresh only if at top
      }
    });
    return () => sub.remove();
  }, [currentIndex]);


  useFocusEffect(
    useCallback(() => {
      // screen is focused → do nothing

      return () => {
        // screen goes out of focus → stop audio
        TrackPlayer.pause().catch(() => { });
        TrackPlayer.stop().catch(() => { });
        TrackPlayer.reset().catch(() => { });
      };
    }, [])
  );

  // ============================================================
  // FILTER POSTS BY TAB (BREAKING / TRENDING / LATEST)
  // ============================================================
  const posts = articles;

  const getApiParamsForTab = (tabKey?: string) => {
    const key = tabKey ?? activeTab;

    if (key === "breaking") return { is_breaking: true };
    if (key === "trending") return { is_trending: true };
    if (key === "exclusive") return { is_exclusive: true };
    if (!isNaN(Number(key))) return { category_id: Number(key) };
    return {}; // latest
  };



  // ============================================================
  // PULL TO REFRESH
  // ============================================================
  const refreshEnabled = currentIndex === 0 && isTextMode;

  const onRefresh = useCallback(async () => {
    if (!refreshEnabled) return;

    setRefreshing(true);
    ToastAndroid.show("Refreshing…", ToastAndroid.SHORT);

    await fetchArticles(true); // reset=true for refresh
    setRefreshing(false);

    setCurrentIndex(0);
    if (flatListRef.current && posts.length > 0) {
      flatListRef.current.scrollToIndex({ index: 0, animated: false });
    }
    setSelectedArticle(posts[0] ?? null);
  }, [refreshEnabled, fetchArticles, posts]);

  // ============================================================
  // PREFETCH IMAGES
  // ============================================================
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const next = posts.slice(currentIndex + 1, currentIndex + 3);
    const urls = next.map((a) => a?.media?.url || a?.media?.thumbnail).filter(Boolean);

    if (urls.length > 0) {
      const t = setTimeout(() => prefetchImages(urls), 500);
      return () => clearTimeout(t);
    }
  }, [currentIndex, posts]);

  // ============================================================
  // HANDLE SCROLL / INFINITE LOAD
  // ============================================================
  const handleIndexChange = useCallback(
    (idx: number) => {
      setCurrentIndex(idx);
      setCurrentVisibleIndex(idx);
      setSelectedArticle(posts[idx]);

      // Trigger pagination EARLIER to prevent white screens during fast scrolling
      if (idx >= posts.length - 15 && hasMore && !isFetching && !isLoadingMore) {
        console.log("Triggering pagination");
        const params = getApiParamsForTab(activeTab);
        loadMoreArticles(
          params.category_id,
          "state-articles",
          undefined,
          params.is_breaking,
          params.is_trending,
          params.is_exclusive
        );

      }
    },
    [posts, hasMore, isFetching, isLoadingMore, loadMoreArticles]
  );

  // ============================================================
  // MODE SWITCH: TEXT ↔ AUDIO
  // ============================================================
  const handleToggleMode = useCallback(
    (mode: boolean) => {
      setIsTextMode(mode);
      // Stay on current index
      if (flatListRef.current && posts.length > 0) {
        flatListRef.current.scrollToIndex({ index: currentIndex, animated: false });
      }
    },
    [currentIndex, posts.length]
  );

  // ============================================================
  // TAB CHANGE
  // ============================================================
  const handleTabPress = useCallback(
    async (key: string) => {
      if (key === "sidebar") {
        setSidebarVisible(true);
        return;
      }

      // Update tab
      setActiveTab(key);

      // Reset index for new feed
      setCurrentIndex(0);

      // Get params based on clicked tab (not activeTab)
      const params = getApiParamsForTab(key);

      // Fetch correct feed
      await fetchArticles(
        true,
        params.category_id,
        "state-articles",
        undefined,
        params.is_trending,
        params.is_breaking,
        params.is_exclusive
      );

      // ⭐ SCROLL RESTORE LOGIC
      if (key === "latest") {
        // Restore last saved index for latest feed
        const savedIndex =
          useArticlesStore.getState().lastViewedIndexByCategory?.latest || 0;

        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: savedIndex,
            animated: false,
          });
        }, 50);
      } else {
        // For breaking, trending, exclusive, category, state → always go to top
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: 0,
            animated: false,
          });
        }, 50);
      }
    },
    [fetchArticles]
  );



  // ============================================================
  // FLATLIST CONFIG
  // ============================================================
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index?: number }> }) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0]?.index ?? 0;
        handleIndexChange(idx);
      }
    },
    [handleIndexChange]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      return (
        <View style={{ height: CONTENT_HEIGHT, width: Dimensions.get("window").width }}>
          {isTextMode ? (
            <ArticleTextMode
              article={item}
              index={index}
              CONTENT_HEIGHT={CONTENT_HEIGHT}
              TOP_BAR_HEIGHT={topBarHeight}
              isVisible={index === currentVisibleIndex}
              colors={Colors}
              t={t}
              getLangCode={getLangCode}
              getFont={getFont}
              deviceId={data.device_id}
              isTextMode={isTextMode}
              totalPosts={posts.length}
              activeTab={activeTab}
              stats={{ views: 0, likes: 0, shares: 0, comments: 0 }}
              onShare={() => setShareVisible(true)}
              onComment={() => {
                setSelectedArticleId(item.article_id);
                setCommentVisible(true);
              }}
              onReport={() => setReportVisible(true)}
              onToggleMode={handleToggleMode}
            />
          ) : index === currentIndex ? (
            <ArticleAudioMode
              article={item}
              index={index}
              CONTENT_HEIGHT={CONTENT_HEIGHT}
              TOP_BAR_HEIGHT={topBarHeight}
              colors={Colors}
              t={t}
              getLangCode={getLangCode}
              getFont={getFont}
              deviceId={data.device_id}
              isTextMode={isTextMode}
              totalPosts={posts.length}
              activeTab={activeTab}
              stats={{ views: 0, likes: 0, shares: 0, comments: 0 }}
              currentIndex={currentIndex}
              posts={posts}
              onShare={() => setShareVisible(true)}
              onComment={() => {
                setSelectedArticleId(item.article_id);
                setCommentVisible(true);
              }}
              onReport={() => setReportVisible(true)}
              onToggleMode={handleToggleMode}
              onSelectArticle={(a, i) => {
                setCurrentIndex(i);
                flatListRef.current?.scrollToIndex({ index: i, animated: false });
              }}
            />
          ) : (
            <View />
          )}
        </View>
      );
    },
    [
      CONTENT_HEIGHT,
      isTextMode,
      currentVisibleIndex,
      Colors,
      t,
      getLangCode,
      getFont,
      data.device_id,
      posts.length,
      activeTab,
      currentIndex,
      posts,
      handleToggleMode,
    ]
  );

  // ============================================================
  // RENDER - LOADING
  // ============================================================

  // if (screenLoading) {
  //   return (
  //     <View style={styles.loaderContainer}>
  //       <ArticleTextModeShimmer />
  //       <Text style={styles.loaderText}>Loading…</Text>
  //     </View>
  //   );
  // }


  if (isFetching && posts.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ArticleTextModeShimmer />
        <Text style={styles.loaderText}>Loading articles…</Text>
      </View>
    );
  }

  // ============================================================
  // RENDER MAIN UI
  // ============================================================
  return (
    // <View
    // style={[
    //   styles.root,
    //   { backgroundColor: Colors.darkpurple, paddingTop: insets.top + fh(20) },
    // ]}
    // >
    <SafeAreaView edges={["top", "bottom"]} style={[
      styles.root,
      { backgroundColor: Colors.darkpurple },
    ]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={barStyle} />

      <TopBarContainer
        backgroundColor={Colors.darkpurple}
        onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height)}
      >
        <TopBar
          tabs={filterTabsForTopBar()}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          labelStyle={{ color: "#888" }}
          activeLabelStyle={{ color: Colors.topbarActiveLabel }}
        />
      </TopBarContainer>

      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No articles available</Text>
        </View>
      ) : (
        // <FlashList
        //   ref={flashListRef}
        //   data={posts}
        //   renderItem={renderItem}
        //   keyExtractor={(item, index) =>
        //     item.article_id?.toString() || index.toString()
        //   }
        //   estimatedItemSize={CONTENT_HEIGHT}
        //   estimatedListSize={{
        //     height: SCREEN_H,
        //     width: Dimensions.get("window").width,
        //   }}
        //   pagingEnabled
        //   decelerationRate="fast"
        //   snapToInterval={CONTENT_HEIGHT}
        //   snapToAlignment="start"
        //   disableIntervalMomentum
        //   showsVerticalScrollIndicator={false}
        //   bounces={false}
        //   removeClippedSubviews
        //   viewabilityConfig={viewabilityConfig}
        //   onViewableItemsChanged={onViewableItemsChanged}
        //   scrollEnabled={isTextMode}
        //   getItemLayout={(_, index) => ({
        //     length: CONTENT_HEIGHT,
        //     offset: CONTENT_HEIGHT * index,
        //     index,
        //   })}
        //   refreshControl={
        //     <RefreshControl
        //       refreshing={refreshing}
        //       onRefresh={onRefresh}
        //       colors={["#997DDF"]}
        //       tintColor="#997DDF"
        //       enabled={refreshEnabled}
        //     />
        //   }
        // />
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.article_id?.toString() || index.toString()}
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
          scrollEnabled={isTextMode}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#997DDF"]}
              tintColor="#997DDF"
              enabled={refreshEnabled}
            />
          }
        />

      )}

      {/* MODALS */}
      {selectedArticleId && (
        <CommentModal
          visible={commentVisible}
          onClose={() => setCommentVisible(false)}
          contentId={selectedArticleId}
          contentType="articles"
        />
      )}

      <ReportModal visible={reportVisible} onClose={() => setReportVisible(false)} />

      <SidebarPanel visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      <ArticleShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        article={selectedArticle}
      />
      {/* </View> */}
    </SafeAreaView>
  );
};

// ============================================================
const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#bbb",
    fontSize: ff(14),
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: "#ccc",
    marginTop: 10,
  },
});

export default ArticleScreen;