// screens/Article/ArticleScreen.tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  AppState,
  ToastAndroid,
  BackHandler,
  Animated,
  PanResponder
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import ArticleTextModeShimmer from "../../components/shimmers/ArticleTextModeShimmer";
import { useContentTabs } from "../../hooks/useContentTabs";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { useArticlesStore } from "../../../utils/store/useArticlesStore";


import TopBar from "../../components/TopBar";
import TopBarContainer from "../../components/layout/TopBarContainer";
import CommentModal from "../../components/CommentModal";
import ReportModal from "../../components/ReportModal";
import SidebarPanel from "../Sidebar/SidebarPanel";
import ArticleTextMode from "./ArticleTextMode";
import ArticleAudioMode from "./ArticleAudioMode";
import PagerView from "react-native-pager-view";
import TrackPlayer from "react-native-track-player";
import { transliterateText } from "../../../utils/transliteration";
import { fw, fh, ff, getTopInset } from "../../../utils/responsive";
import { MMKV } from "react-native-mmkv";
import ArticleShareModal from "../../components/share/article/ArticleShareModal";
import { prefetchImages } from "../../../utils/prefetchImages";
import { performance } from "react-native-performance";

const mmkv = new MMKV();

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const ArticleScreen = () => {
  const navigation = useNavigation();

  const SAFE_TOP = getTopInset(); 
  const TOTAL_TOP_OFFSET = SAFE_TOP;

  const route = useRoute<any>();

  useEffect(() => {
    const now = global.performance?.now?.() ?? Date.now();
  console.log(`📌 ${route.name} mounted at`, now);
  }, []);


  const hasResetRef = useRef(false);
  useEffect(() => {
    const now = Date.now();
    const lastSession = mmkv.getNumber("lastSession") ?? 0;
    const isColdStart = now - lastSession > 10 * 1000; // >10 s gap means app was fully closed

    if (isColdStart && !hasResetRef.current) {
      hasResetRef.current = true;
      useArticlesStore.setState({ lastViewedIndexByCategory: {} });
    }

    mmkv.set("lastSession", now);
  }, []);

  // State Management
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [isTextMode, setIsTextMode] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [audioAbortVersion, setAudioAbortVersion] = useState(0);
  const [pagerReady, setPagerReady] = useState(false);


  // 🔄 Pull-to-refresh gesture setup
  const pullY = useRef(new Animated.Value(0)).current;
  const isPulling = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        currentIndex === 0 && gestureState.dy > 15, // only on first article
      onPanResponderMove: (_, gestureState) => {
        if (currentIndex === 0 && gestureState.dy > 0) {
          pullY.setValue(Math.min(gestureState.dy, 100));
        }
      },
      onPanResponderRelease: async (_, gestureState) => {
        if (gestureState.dy > 70 && currentIndex === 0 && !isPulling.current) {
          isPulling.current = true;
          setRefreshing(true);
          ToastAndroid.show("Refreshing articles...", ToastAndroid.SHORT);
          try {
            const { endpoint, category_id } = resolveArticleEndpoint(activeTab);
            await fetchArticles(true, category_id, endpoint, {
              district_id: data?.district_id,
              mandal_id: data?.mandal_id,
              village_id: data?.village_id,
            });
            setCurrentIndex(0);
            setPagerPage(0);
            setSelectedArticle(useArticlesStore.getState().articles?.[0] ?? null);
          } catch (err) {
            console.error("❌ Pull refresh failed:", err);
          } finally {
            setRefreshing(false);
            isPulling.current = false;
          }
        }

        Animated.spring(pullY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const pagerRef = useRef<PagerView>(null);
  const setPagerPage = useCallback(
    (page: number, animated?: boolean) => {
      const pager: any = pagerRef.current;
      if (!pager) return;
      const shouldAnimate = animated ?? isTextMode;
      if (!shouldAnimate && typeof pager.setPageWithoutAnimation === "function") {
        pager.setPageWithoutAnimation(page);
      } else {
        pager.setPage(page);
      }
    },
    [isTextMode]
  );

  // Hooks and Context
  const { tabs, categories, activeTab, setActiveTab, selectedCategories, setSelectedCategories } = useContentTabs();

  const { Colors, barStyle } = useTheme();
  const { t, getFont, getLangCode, data } = useOnboarding();
  const { articleId, fromExclusive, fromTrending, fromBreaking, mode } = route.params || {};

  const { articles, fetchArticles, loadMoreArticles, hasMore, isFetching } = useArticlesStore();

  // 🔥 Prefetch top 10 article images whenever articles change
useEffect(() => {
  if (!articles || articles.length === 0) return;

  const urls = articles
    .map(a => a?.media?.url || a?.media?.thumbnail)
    .filter(Boolean);

  prefetchImages(urls);
}, [articles]);


  useEffect(() => {
    if (articles.length > 0) {
      setSelectedArticle(articles[currentIndex] ?? articles[0]);
    }
  }, [articles, currentIndex]);

  // Refs for stable access inside async/event handlers
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Memoized localized tabs
  const [localizedTabs, setLocalizedTabs] = useState(tabs);

  useEffect(() => {
    const isTelugu = getLangCode() === "te";

    async function updateTabs() {
      const updated = await Promise.all(
        tabs.map(async (tab) => {
          if (tab.key === "state") {
            const baseLabel =
              data?.village_name || data?.state?.name || "State";

            // 🪄 If language is Telugu, transliterate the name
            if (isTelugu && baseLabel) {
              const teLabel = await transliterateText(baseLabel, "te");
              return { ...tab, label: teLabel };
            } else {
              return { ...tab, label: baseLabel };
            }
          }
          return tab;
        })
      );

      // Maintain the same ordering logic as before
      const sidebarTab = updated.find((t) => t.key === "sidebar");
      const latestTab = updated.find((t) => t.key === "latest");
      const stateTab = updated.find((t) => t.key === "state");
      const selectedTabs = updated.filter((t) =>
        selectedCategories.includes(t.key)
      );

      const orderedTabs = [
        ...(sidebarTab ? [sidebarTab] : []),
        ...(latestTab ? [latestTab] : []),
        ...(stateTab ? [stateTab] : []),
        ...selectedTabs,
      ];

      setLocalizedTabs(orderedTabs);
    }

    updateTabs();
  }, [tabs, data.village_name, data.state?.name, selectedCategories, getLangCode]);

  useEffect(() => {
    if (!fromExclusive && !fromBreaking && !fromTrending) {
      fetchArticles();
    }
  }, [fromExclusive, fromBreaking, fromTrending]);

  // Filter posts
  const { posts, startIndex } = useMemo(() => {
    let filtered = articles;

    // 🚫 Filter out Breaking and Trending when in category tabs
    if (activeTab !== "latest" && activeTab !== "state") {
      filtered = filtered.filter(
        (a: any) => !a.is_breaking && !a.is_trending
      );
    }

    let startIdx = 0;
    if (articleId) {
      const idx = filtered.findIndex((a: any) => a.article_id === articleId);
      startIdx = idx >= 0 ? idx : 0;
    }

    return { posts: filtered, startIndex: startIdx };
  }, [articles, activeTab, articleId]);

  // Keep stable refs for posts and mode used inside audio listeners
  const postsRef = useRef(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const isTextModeRef = useRef(isTextMode);
  useEffect(() => {
    isTextModeRef.current = isTextMode;
  }, [isTextMode]);

  useEffect(() => {
    pagerRef.current?.setScrollEnabled(isTextMode && posts.length > 1);
  }, [isTextMode, posts.length]);

  useEffect(() => {
  if (posts.length > 0) {
    setPagerReady(false);
    setTimeout(() => setPagerReady(true), 10);
  }
}, [posts]);


  // ✅ Initialize selected article (handles Exclusive navigation)
  // useEffect(() => {
  //   if (posts.length === 0) return;

  //   // 1️⃣ From any carousel (Exclusive, Breaking, Trending)
  //   if ((fromExclusive || fromBreaking || fromTrending) && articleId) {
  //     const idx = posts.findIndex((a: any) => a.article_id === articleId);
  //     if (idx >= 0) {
  //       setCurrentIndex(idx);
  //       setSelectedArticle(posts[idx]);
  //       setPagerPage(idx);
  //       return;
  //     }
  //   }

  //   // 2️⃣ Default resume logic (when opened normally)
  //   const store = useArticlesStore.getState();
  //   const savedIdx = store.lastViewedIndexByCategory?.[activeTab] ?? 0;
  //   const validIndex = Math.min(savedIdx, posts.length - 1);
  //   setCurrentIndex(validIndex);
  //   setSelectedArticle(posts[validIndex]);
  //   setPagerPage(validIndex);
  // }, [posts, activeTab, articleId, fromExclusive, fromBreaking, fromTrending, setPagerPage]);

    useEffect(() => {
  if (!pagerReady || posts.length === 0) return;

  // 1️⃣ User opened from any carousel → exact article
  if ((fromExclusive || fromBreaking || fromTrending) && articleId) {
    const idx = posts.findIndex((a) => a.article_id === articleId);

    if (idx >= 0) {
      setCurrentIndex(idx);
      setSelectedArticle(posts[idx]);

      // ⭐ Move after pagerReady
      requestAnimationFrame(() => {
        setPagerPage(idx, false);
      });

      return;
    }
  }

  // 2️⃣ Resume index
  const store = useArticlesStore.getState();
  const savedIdx = store.lastViewedIndexByCategory?.[activeTab] ?? 0;
  const validIndex = Math.min(savedIdx, posts.length - 1);

  setCurrentIndex(validIndex);
  setSelectedArticle(posts[validIndex]);

  requestAnimationFrame(() => {
    setPagerPage(validIndex, false);
  });
}, [pagerReady]);


 

  // Mode initialization
  useEffect(() => {
    if (mode === "audio") {
      setIsTextMode(false);
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      TrackPlayer.stop().catch(() => {});
      TrackPlayer.reset().catch(() => {});
    };
  }, []);

  // Helper functions
  const resolveArticleEndpoint = (tabKey: string) => {
    // 🟢 Category tabs → call state-articles
    if (!isNaN(Number(tabKey))) {
      return { endpoint: "state-articles", category_id: Number(tabKey) };
    }

    // 🟣 Latest tab → global state-level feed
    if (tabKey === "latest") {
      return { endpoint: "state-articles" };
    }

    // 🟡 State tab → localized feed
    if (tabKey === "state") {
      return { endpoint: "articles" };
    }

    // Default fallback
    return { endpoint: "state-articles" };
  };

  const handleTabPress = async (key: string) => {
    if (key === "sidebar") {
      setSidebarVisible(true);
      return;
    }

    setActiveTab(key);

    // 🟣 1. Latest tab → resume from cache
    if (key === "latest") {
      const latestKey = `latest`;
      const storeState = useArticlesStore.getState();
      const cache = storeState.articlesByCategory?.[latestKey];
      const savedIndex =
        typeof storeState.lastViewedIndexByCategory?.[latestKey] === "number"
          ? (storeState.lastViewedIndexByCategory?.[latestKey] as number)
          : 0;
      const fresh =
        cache?.lastFetchedAt &&
        Date.now() - cache.lastFetchedAt < 10 * 60 * 1000;

      if (cache && fresh) {
        useArticlesStore.setState({
          articles: cache.items,
          cursor: cache.cursor,
          hasMore: cache.hasMore,
          lastFetchedAt: cache.lastFetchedAt,
          isFetching: false,
        });
        const resumeIdx = Math.max(0, Math.min(savedIndex, cache.items.length - 1));
        setCurrentIndex(resumeIdx);
        setSelectedArticle(cache.items[resumeIdx] ?? null);
        setPagerPage(resumeIdx, false);
      } else {
        await fetchArticles(
          false,
          undefined,
          "state-articles"
        );
        const items = useArticlesStore.getState().articles || [];
        setCurrentIndex(0);
        setSelectedArticle(items[0] ?? null);
        setPagerPage(0, false);
      }
      return;
    }

    // 🟢 2. State or Category tabs → always fresh
    const { endpoint, category_id } = resolveArticleEndpoint(key);

    useArticlesStore.getState().resetPagination?.();
    setCurrentIndex(0);
    setSelectedArticle(null);
    setPagerPage(0, false);

    try {
      await fetchArticles(
        true, // reset
        category_id,
        endpoint, // "articles" for both state & category
        {
          district_id: data.district_id,
          mandal_id: data.mandal_id,
          village_id: data.village_id,
        }
      );
    } catch (err) {
      console.error("Error fetching articles:", err);
    }
  };

  const handleIndexChange = (idx: number) => {
    setCurrentIndex(idx);
    setSelectedArticle(posts[idx]);

    // Save resume index for Latest
    if (activeTab === "latest") {
      useArticlesStore.getState().setLastViewedLatest?.(idx);
      // Prefetch next page when nearing the end for Latest only
      if (hasMore && !isFetching) {
        const remaining = (articles || []).length - (idx + 1);

        if (remaining <= 2) {
          loadMoreArticles(undefined, "state-articles");
        }
      }
    }
  };

  const handleToggleMode = useCallback(
    (textMode: boolean) => {
      setIsTextMode(textMode);
      setPagerPage(currentIndex, false);
      pagerRef.current?.setScrollEnabled(textMode && posts.length > 1);
      if (textMode) {
        setAudioAbortVersion((prev) => prev + 1);
      }
    },
    [currentIndex, posts.length, setPagerPage]
  );

  const handlePlayPause = () => {
    // This is now handled entirely in ArticleAudioMode with TrackPlayer
    console.log("Play/Pause handled in ArticleAudioMode with TrackPlayer");
  };

  const handleCategoryTap = (categoryId: number) => {
    const catKey = String(categoryId);

    // 1️⃣ Highlight in TopBar
    setActiveTab(catKey);
    setCurrentIndex(0);
    setSelectedArticle(null);
    setPagerPage(0, false);

    // 2️⃣ Mark selected in SidebarPanel
    if (!selectedCategories.includes(catKey)) {
      setSelectedCategories([...selectedCategories, catKey]);
    }

    // 3️⃣ Fetch category-specific articles
    fetchArticles(true, categoryId)
      .then(() => console.log(`✅ Loaded category ${categoryId}`))
      .catch((err) => console.error("❌ Failed to load category:", err));
  };

  const loading = articles.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: Colors.darkpurple }]}>
      <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />

      {/* TopBar */}
      {(!articleId || posts.length > 1) && (
        <TopBarContainer backgroundColor={Colors.darkpurple}>
          <TopBar
            tabs={localizedTabs}
            activeTab={activeTab}
            onTabPress={handleTabPress}
            labelStyle={{ color: "#888" }}
            activeLabelStyle={{
              color: Colors.topbarActiveLabel,
              fontWeight: "700",
            }}
          />
        </TopBarContainer>
      )}

      <View
  style={[
    styles.deckContainer,
    { paddingTop: TOTAL_TOP_OFFSET }
  ]}
  {...(currentIndex === 0 ? panResponder.panHandlers : {})}
>


        <Animated.View
          style={{
            position: "absolute",
            top: fh(40),
            alignSelf: "center",
            zIndex: 20,
            opacity: pullY.interpolate({
              inputRange: [10, 80],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
            transform: [
              {
                translateY: pullY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 25],
                  extrapolate: "clamp",
                }),
              },
            ],
          }}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.lavenderPurple} />
          ) : (
            <Text
              style={{
                color: Colors.textcolor,
                fontFamily: getFont("medium"),
                fontSize: ff(12),
              }}
            >
              ↓ Pull to refresh
            </Text>
          )}
        </Animated.View>

        {/* Loading State */}
        {isFetching && (
          <View style={{ paddingVertical: fh(15), alignItems: "center" }}>
            <ActivityIndicator size="small" color={Colors.lavenderPurple} />
          </View>
        )}

        {/* Empty State */}
        {!isFetching && posts.length === 0 && (
          <View style={styles.loader}>
            <Text
              style={{
                color: Colors.textcolor,
                fontFamily: getFont("medium"),
                fontSize: ff(14),
              }}
            >
              No Articles Available
            </Text>
          </View>
        )}

        {/* Content */}
        {loading || !pagerReady ? (
            // ⬇️ Show shimmer full-screen
            <ArticleTextModeShimmer />
          ) : (
            posts.length > 0 && (
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={currentIndex}
            orientation="vertical"
            scrollEnabled={isTextMode && posts.length > 1}
            onPageSelected={(e) => {
              const page = e.nativeEvent.position;
              handleIndexChange(page);
            }}
            overScrollMode="never"
          >
            {posts.map((item, index) => (
              <View key={index} style={{ flex: 1 }}>
                {isTextMode ? (
                  <ArticleTextMode
                    article={item}
                    onPressCategory={handleCategoryTap}
                    index={index}
                    totalPosts={posts.length}
                    colors={Colors}
                    t={t}
                    getFont={getFont}
                    getLangCode={getLangCode}
                    deviceId={data.device_id ?? ""}
                    onReport={() => setReportVisible(true)}
                    onShare={() => setShareVisible(true)}
                    onComment={() => {
                      setSelectedArticleId(item.article_id);
                      setCommentVisible(true);
                    }}
                    onToggleMode={handleToggleMode}
                    isTextMode={isTextMode}
                    activeTab={activeTab}
                  />
                ) : index === currentIndex ? (
                  <ArticleAudioMode
                    article={item}
                    index={index}
                    totalPosts={posts.length}
                    colors={Colors}
                    t={t}
                    getFont={getFont}
                    getLangCode={getLangCode}
                    deviceId={data.device_id ?? ""}
                    onReport={() => setReportVisible(true)}
                    onShare={() => setShareVisible(true)}
                    onComment={() => {
                      setSelectedArticleId(item.article_id);
                      setCommentVisible(true);
                    }}
                    onToggleMode={handleToggleMode}
                    isTextMode={isTextMode}
                    activeTab={activeTab}
                    posts={posts}
                    currentIndex={currentIndex}
                    modeSwitchVersion={audioAbortVersion}
                    onSelectArticle={(newArticle, newIndex) => {
                      setCurrentIndex(newIndex);
                      setSelectedArticle(newArticle);
                      setPagerPage(newIndex, false);
                    }}
                  />
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            ))}
          </PagerView>
          )
        )}
      </View>

      {/* Modals */}
      <SidebarPanel
        visible={isSidebarVisible}
        onClose={() => setSidebarVisible(false)}
        categories={categories}
        activeCategoryKey={activeTab}
        selectedCategories={selectedCategories}
        onCategoryPress={(cat) => {
          setSelectedCategories((prev) =>
            prev.includes(cat.key)
              ? prev.filter((c) => c !== cat.key)
              : [...prev, cat.key]
          );
        }}
      />
      <ArticleShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        article={selectedArticle}
      />
      {selectedArticleId && (
        <CommentModal
          visible={commentVisible}
          onClose={() => setCommentVisible(false)}
          contentId={selectedArticleId}
          contentType="articles"
        />
      )}
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        article={selectedArticle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  topbarContainer: {
    zIndex: 10
  },
  topbarInner: {
    marginTop: fh(10),
    marginBottom: fh(-20),
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  deckContainer: {
    flex: 1,
  },
});

export default ArticleScreen;
