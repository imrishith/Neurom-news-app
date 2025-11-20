import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  StatusBar,
  Text,
  Platform,
  RefreshControl, ScrollView, TouchableWithoutFeedback,
  BackHandler,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import PagerView from "react-native-pager-view";
import { useNavigation } from "@react-navigation/native";
import SidebarPanel from "../Sidebar/SidebarPanel";
import ShareModal from "../../components/ShareModal";
import { shareToWhatsApp } from "../../../utils/shareUtils";
import CommentModal from "../../components/CommentModal";
import InteractionsRow from "../../components/InteractionRow";

import { useBuzzStore } from "../../../utils/store/useBuzzStore";
import Video from "react-native-video";
import NetInfo from "@react-native-community/netinfo";
import FastImage from "react-native-fast-image";
import { useOnboarding } from "../../context/OnboardingContext";
import { useContentTabs } from "../../hooks/useContentTabs";
import Colors from "../../constants/colors";
import { fw, fh, ff } from "../../../utils/responsive";
import { useIsFocused } from "@react-navigation/native";
// ✅ import TopBar + Button
import TopBar from "../../components/TopBar";
import TopBarContainer from "../../components/layout/TopBarContainer";
import Button from "../../components/Button";
import { useAppRefresh } from "../../../utils/useAppRefresh";
import { MMKV } from "react-native-mmkv";
import BuzzShareModal from "../../components/share/buzz/BuzzShareModal";
import MagazineShareModal from "../../components/share/magazine/MagazineShareModal";
import { useMagazinesStore } from "../../../utils/store";
import { useDailyWrapsStore } from "../../../utils/store/useDailyWrapsStore";
const mmkv = new MMKV();


const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 44; // iPhone notch ~44
const BOTTOM_BAR_HEIGHT = fh(60); // your BottomBar height

const imageHeight = Dimensions.get("window").height - STATUS_BAR_HEIGHT - BOTTOM_BAR_HEIGHT;


// Shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BuzzScreen = () => {

  const hasResetRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    const lastSession = mmkv.getNumber("lastSession") ?? 0;
    const isColdStart = now - lastSession > 10 * 1000; // gap >10s means app was killed

    if (isColdStart && !hasResetRef.current) {

      hasResetRef.current = true;

      // 🧹 Reset Buzz-related state only
      useBuzzStore.setState({
        lastViewedBuzzIndex: 0,
      });
    }

    mmkv.set("lastSession", now);
  }, []);


  const { data, getLangCode } = useOnboarding();
  const lang = getLangCode();
  const { tabs = [], categories = [], activeTab, setActiveTab, selectedCategories = [], setSelectedCategories } = useContentTabs();
  const {
    buzzContents,
    fetchBuzzContents,
    loadMoreBuzz,
    buzzHasMore,
    setLastViewedBuzzIndex,
    lastViewedBuzzIndex,
  } = useBuzzStore();

  const {
    magazines,
    fetchMagazines,
    loadMoreMagazines,
    magHasMore,
  } = useMagazinesStore();

  const {
    dailyWraps,
    fetchDailyWraps
  } = useDailyWrapsStore();


  // Local state and view control
  const [loading, setLoading] = useState(true);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const isFocused = useIsFocused();
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0]));
  const [refreshing, setRefreshing] = useState(false);
  const [speedMbps, setSpeedMbps] = useState<number | null>(null);
  const [shownMagIds, setShownMagIds] = useState<Set<number>>(new Set());

  const [buzzPage, setBuzzPage] = useState(1);
  const [magPage, setMagPage] = useState(1);
  const [hasMoreBuzz, setHasMoreBuzz] = useState(true);
  const [hasMoreMag, setHasMoreMag] = useState(true);
  const pagerRef = useRef<PagerView>(null);
  const [pagerEnabled, setPagerEnabled] = useState(true);
  // Local loading flags so whichever API returns first can display immediately
  const [catLoadingBuzz, setCatLoadingBuzz] = useState(false);
  const [catLoadingMag, setCatLoadingMag] = useState(false);

  const navigation = useNavigation();

  // Detect network speed once
  useEffect(() => {
    (async () => {
      try {
        const state = await NetInfo.fetch();
        const dl: any = (state as any)?.details?.downlink;
        if (typeof dl === "number" && dl > 0) setSpeedMbps(dl);
      } catch {
        setSpeedMbps(null);
      }
    })();
  }, []);

  const selectBestVariant = useCallback((media: any, mbps?: number | null) => {
    const variants: Record<string, string> | undefined = media?.variants;
    if (!variants) return null;
    let tier: "480p" | "720p" | "1080p" = "720p";
    if (typeof mbps === "number") {
      if (mbps < 1.5) tier = "480p";
      else if (mbps <= 3) tier = "720p";
      else tier = "1080p";
    }
    const chosen = variants[tier] || variants["720p"] || variants["480p"] || variants["1080p"];
    // if (__DEV__) console.log(`🟣 Buzz wrap variant selected: ${tier} → ${chosen}`);
    return chosen || null;
  }, []);


  // ✅ Localized Tabs like ArticleScreen
  // Localized Tabs like ArticleScreen
  const localizedTabs = useMemo(() => {
    if (!tabs || tabs.length === 0) return [];
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

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const categoryId = getActiveCategoryId();
      await fetchBuzzContents(categoryId, true);  // skip cache; avoid re-fetching magazines/wraps
    } catch (err) {
      console.error("❌ Buzz refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  /*
  const combinedContent = useMemo(() => {
    const normalizedMagazines = (magazines || []).map((m) => {
      const langCode = getLangCode(); // 'te' or 'en'

      const title = langCode === "te" ? (m.title_te || null) : (m.title_en || null);
      const mediaUrl = langCode === "te" ? (m.media_te?.url || null) : (m.media_en?.url || null);
      const pages = langCode === "te" ? (m.pages_te || []) : (m.pages_en || []);
      const sortedPages = pages ? [...pages].sort((a: any, b: any) => (a?.page_number || 0) - (b?.page_number || 0)) : [];

      return {
        id: `mag-${m.magazine_id}`,
        type: "magazine" as const,
        title,
        mediaUrl,
        pages: sortedPages,
        createdAt: m.published_at || m.created_at,
        stats: m.stats || {},
        magazine_id: m.magazine_id,
        category: m.Category,
      };
    });



    const normalizedBuzz = (buzzContents || []).map((b) => {
      const langCode = getLangCode(); // 'te' or 'en'

      const mediaUrl =
        langCode === "te"
          ? b.media_te?.url || null
          : langCode === "en"
            ? b.media_en?.url || null
            : null; // in case future languages are added

      return {
        id: `buzz-${b.buzz_id}`,
        type: "buzz" as const,
        mediaUrl, // 👈 only selected language media
        createdAt: b.created_at,
        stats: b.stats || {},
        buzz_id: b.buzz_id,
        category: b.Category,
      };
    });


    // ✅ TypeScript-safe date sort
    const sortedBuzz = [...normalizedBuzz].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const sortedMagazines = [...normalizedMagazines].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // ✅ Buzz first, then Magazines
    const merged = [...sortedBuzz, ...sortedMagazines];

    return merged;
  }, [magazines, buzzContents]);
  */


  // Initial fetch of all three sources
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBuzzContents(),
          fetchMagazines(),
          fetchDailyWraps(),
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getActiveCategoryId = useCallback(() => {
    if (activeTab === "latest") return null;
    if (!categories || categories.length === 0) return null;
    const cat = categories.find((c) => String(c.key) === String(activeTab));
    return cat ? Number(cat.category_id) : null;
  }, [activeTab, categories]);


  // Fetch Buzz only on tab change (avoid repeating magazines/wraps calls)
  useEffect(() => {
    if (!categories || categories.length === 0) return;

    const categoryId = getActiveCategoryId();

    // 🧹 Clear only Buzz-related data when switching tabs
    useBuzzStore.setState({
      buzzContents: [],
      buzzCursor: null,
      buzzHasMore: true,
    });

    // 🟢 Fetch Buzz again for selected category
    setCatLoadingBuzz(true);
    fetchBuzzContents(categoryId, true).finally(() => setCatLoadingBuzz(false));
  }, [activeTab]);

  // Unified feed combining Buzz, Magazines, Wraps
  const unifiedFeed = useMemo(() => {
    const langCode = getLangCode();
    const today = new Date().toISOString().split("T")[0];

    // Buzz
    const buzzNormalized = (buzzContents || []).map((b) => ({
      id: `buzz-${b.buzz_id}`,
      type: "buzz" as const,
      title: null,
      mediaUrl: langCode === "te" ? b.media_te?.url || null : b.media_en?.url || null,
      createdAt: b.created_at,
      stats: b.stats || {},
      buzz_id: b.buzz_id,
      category: b.Category,
    }));

    // Magazines
    const magsNormalized = (magazines || []).map((m) => {
      const title = langCode === "te" ? m.title_te || m.title_en : m.title_en || m.title_te;
      const mediaUrl = langCode === "te" ? m.media_te?.url || null : m.media_en?.url || null;
      const pages = langCode === "te" ? m.pages_te || [] : m.pages_en || [];
      const sortedPages = [...(pages || [])].sort((a: any, b: any) => (a?.page_number || 0) - (b?.page_number || 0));
      return {
        id: `mag-${m.magazine_id}`,
        type: "magazine" as const,
        title,
        mediaUrl,
        pages: sortedPages,
        createdAt: m.published_at || m.created_at,
        stats: m.stats || {},
        magazine_id: m.magazine_id,
        category: m.Category,
      };
    });

    // Daily Wraps (today only)
    const wrapsNormalized = (dailyWraps || [])
      .filter((w) => w?.published_at?.startsWith?.(today))
      .map((w) => {
        const title = langCode === "te" ? w.title_te || w.title_en : w.title_en || w.title_te;
        const media = langCode === "te" ? w.media_te : w.media_en;
        return {
          id: `wrap-${w.wrap_id}`,
          type: "wrap" as const,
          title,
          media,
          thumbnail: langCode === "te" ? w.media_te?.thumbnail : w.media_en?.thumbnail,
          createdAt: w.published_at || w.created_at,
          stats: w.stats || {},
          wrap_id: w.wrap_id,
          category: w.Category || null,
        };
      });

    return [...buzzNormalized, ...magsNormalized, ...wrapsNormalized].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [buzzContents, magazines, dailyWraps, getLangCode]);

  // Alias for existing references
  const feed = unifiedFeed;

  // Track the last buzz index in the unified feed to decide pagination
  const lastBuzzIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < feed.length; i++) {
      if (feed[i]?.type === "buzz") idx = i;
    }
    return idx;
  }, [feed]);

  // Prevent overlapping load-more calls
  const isLoadingMoreBuzzRef = useRef(false);




  useEffect(() => {
    if (feed.length > 0 && isFocused) {
      const savedIndex = useBuzzStore.getState().lastViewedBuzzIndex ?? 0;
      const boundedIndex = Math.min(savedIndex, feed.length - 1);

      setCurrentPage(boundedIndex);

      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation?.(boundedIndex);
      });
    }
  }, [feed.length, isFocused]);






  // ✅ Load adjacent pages when page changes
  useEffect(() => {
    if (!isFocused) return;

    const newLoadedPages = new Set(loadedPages);

    // Load current page and 1 adjacent page on either side
    newLoadedPages.add(currentPage);
    if (currentPage > 0) newLoadedPages.add(currentPage - 1);
    if (currentPage < feed.length - 1) newLoadedPages.add(currentPage + 1);

    // Unload pages that are too far away (keep current \u00B1 1 only)
    Array.from(newLoadedPages).forEach((page) => {
      if (Math.abs(page - currentPage) > 1) {
        newLoadedPages.delete(page);
      }
    });

    setLoadedPages(newLoadedPages);
  }, [currentPage, feed.length, isFocused]);

  // ✅ Track view events
  useEffect(() => {
    if (isFocused && feed[currentPage]) {
      const item = feed[currentPage];

    }
  }, [currentPage, feed, isFocused]);

  // ✅ Handle page change
  const handlePageSelected = useCallback(
    (e: any) => {
      const newIndex = e.nativeEvent.position;

      // Save current page to local + persisted state
      setCurrentPage(newIndex);
      useBuzzStore.getState().setLastViewedBuzzIndex(newIndex);

      // Load more buzz only when near the end of the buzz segment
      const isNearBuzzEnd = lastBuzzIndex >= 0 && newIndex >= Math.max(0, lastBuzzIndex - 1);
      const isOnBuzzItem = feed[newIndex]?.type === "buzz";
      if (
        isNearBuzzEnd &&
        isOnBuzzItem &&
        buzzHasMore &&
        !isLoadingMoreBuzzRef.current
      ) {
        const categoryId = getActiveCategoryId();
        isLoadingMoreBuzzRef.current = true;
        Promise.resolve(loadMoreBuzz(categoryId)).finally(() => {
          isLoadingMoreBuzzRef.current = false;
        });
      }
    },
    [feed, lastBuzzIndex, buzzHasMore]
  );

  // Local wrapper to memoize contentType for InteractionsRow
  const BuzzInteractionsRow: React.FC<{
    item: any;
    stats: {
      likes_count?: number;
      comments_count?: number;
      shares_count?: number;
      dislikes_count?: number;
      saves_count?: number;
      views_count?: number;
    };
    contentId: number | string;
  }> = ({ item, stats, contentId }) => {
    const contentType = useMemo(
      () => (item.type === "magazine" ? "magazines" : item.type === "wrap" ? "videos" : "buzz"),
      [item.type]
    );
    return (
      <InteractionsRow
        stats={stats}
        tintColor={Colors.textcolor}
        backgroundColor="#49425B33"
        deviceId={data.device_id}
        contentType={contentType}
        contentId={contentId}
        compact={false}
        onShare={() => setShareVisible(true)}
        onComment={() => {
          setSelectedContentId(item.buzz_id || item.wrap_id || item.magazine_id);
          setCommentVisible(true);
        }}
        containerStyle={styles.interactionsContainer}
      />
    );
  };


  // Inline components for wrap video and magazine pages
  const WrapVideoItem: React.FC<{ item: any; isActive: boolean; setPagerEnabled: (enabled: boolean) => void }> = ({ item, isActive, setPagerEnabled }) => {
    const [isBuffering, setIsBuffering] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const uri = selectBestVariant(item.media, speedMbps);
    if (!uri) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Video unavailable</Text>
        </View>
      );
    }
    return (
      <View style={[styles.imageWrapper, { height: imageHeight }]}>
        <Video
          source={{ uri }}
          style={styles.fullscreenImage}
          resizeMode="cover"
          paused={!isActive || isPaused}
          repeat
          onBuffer={(e) => {
            const buffering = !!e?.isBuffering;
            setIsBuffering(buffering);
            setPagerEnabled(!buffering);
          }}
          onLoadStart={() => {
            setIsBuffering(true);
            setPagerEnabled(false);
          }}
          onLoad={() => {
            setIsBuffering(false);
            setPagerEnabled(true);
          }}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fullScreenGradient}
          pointerEvents="none"
        />
        <View style={{ position: "absolute", left: fw(16), right: fw(16), bottom: fh(24) }} pointerEvents="none">
          {!!item.title && <Text style={{ color: "#fff", fontSize: ff(16), fontWeight: "700" }}>{item.title}</Text>}
        </View>
        {isBuffering && (
          <View style={styles.placeholder} pointerEvents="none">
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.placeholderText}>Loading...</Text>
          </View>
        )}
        {/* Tap overlay */}
        <TouchableWithoutFeedback onPress={() => setIsPaused((p) => !p)}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]} />
        </TouchableWithoutFeedback>
      </View>
    );
  };

  const MagazinePagesItem: React.FC<{ item: any; isActive: boolean }> = ({ item }) => {
    const [idx, setIdx] = useState(0);
    const pages = item.pages || [];
    if (!pages || pages.length === 0) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Pages not available</Text>
        </View>
      );
    }
    return (
      <View style={styles.slide}>
        <FlatList
          data={pages}
          keyExtractor={(p) => String(p.page_number)}
          renderItem={({ item: p }) => (
            <View style={styles.slide}>
              <FastImage source={{ uri: p.url }} style={styles.fullscreenImage} resizeMode={FastImage.resizeMode.contain} />
            </View>
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setIdx(i);
          }}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
        />
        {/* <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.fullScreenGradient} /> */}
        <View style={{ position: "absolute", left: fw(16), right: fw(16), bottom: fh(24) }}>
          {/* {!!item.title && <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{item.title}</Text>} */}
          <Text style={{ color: "#fff", marginTop: fh(4) }}>Page {idx + 1} / {pages.length}</Text>
        </View>
      </View>
    );
  };

  // ✅ Render content only if page is loaded
  const renderContent = useCallback(
    (item: any, index: number) => {
      const isLoaded = loadedPages.has(index);
      const isActive = currentPage === index;

      if (!isLoaded) {
        return (
          <View style={styles.placeholder}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.placeholderText}>Loading...</Text>
          </View>
        );
      }

      // normalize stats
      const stats = {
        likes_count: Number(item.stats?.likes_count || 0),
        comments_count: Number(item.stats?.comments_count || 0),
        shares_count: Number(item.stats?.shares_count || 0),
        dislikes_count: Number(item.stats?.dislikes_count || 0),
        saves_count: Number(item.stats?.saves_count || 0),
        views_count: Number(item.stats?.views_count || 0),
      };

      // ✅ category chip label
      const categoryName =
        data.language_code === "te"
          ? item.category?.name_te || item.category?.name_en || "Buzz"
          : item.category?.name_en || "Buzz";

      return (
        <>
          {item.type === "wrap" ? (
            <WrapVideoItem item={item} isActive={isActive} setPagerEnabled={setPagerEnabled} />
          ) : item.type === "magazine" ? (
            <MagazinePagesItem item={item} isActive={isActive} />
          ) : item.mediaUrl ? (
            <View style={[styles.imageWrapper, { height: imageHeight }]}>
              <FastImage
                source={{ uri: item.mediaUrl, priority: FastImage.priority.normal }}
                style={styles.fullscreenImage}
                resizeMode={FastImage.resizeMode.contain}
              />
            </View>
          ) : (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {getLangCode() === "te" ? "తెలుగు మీడియాలో అందుబాటులో లేదు" : "Media not available"}
              </Text>
            </View>
          )}

          {isActive && item.type !== "wrap" && (
            <View style={styles.interactionsViewContainer}>
              <BuzzInteractionsRow item={item} stats={stats} contentId={item.wrap_id || item.magazine_id || item.buzz_id} />
            </View>
          )}
        </>
      );
    },
    [loadedPages, currentPage]
  );


  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        {/**
         * FIX: TopBar horizontal scroll felt blocked because this gradient view sat above it
         * and intercepted touches. On Android, zIndex only applies to positioned elements;
         * since the TopBar wrapper wasn't positioned, the absolutely positioned gradient
         * with zIndex ended up in front, capturing gestures.
         *
         * Solution: keep the gradient visible but non-interactive and ensure the TopBar
         * is a positioned sibling with a higher zIndex. `pointerEvents="none"` here lets
         * all touches pass through to the TopBar and underlying content.
         */}
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.6)",  // start – darker top
            "rgba(0, 0, 0, 0.0)",  // end – fully transparent
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.shadowOverlay}
          pointerEvents="none"
        />


        {/* ✅ TopBar same like ArticleScreen */}
        {/**
         * Ensure the TopBar is fully touchable above overlays:
         * - Make it positioned (absolute) so zIndex works reliably on Android.
         * - Give it a high zIndex (> 50) so it renders above the gradient.
         * - Keep container pointerEvents allowing its children to handle touches.
         */}
        <View
          style={styles.topBarWrap}
          pointerEvents="box-none"
        >
          <TopBarContainer backgroundColor="transparent">
            <TopBar
              tabs={localizedTabs}
              activeTab={activeTab}
              onTabPress={(key) => {
                if (key === "sidebar") setSidebarVisible(true);
                else setActiveTab(key);
              }}
              labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              activeLabelStyle={{ color: "#FFF", fontWeight: "700" }}
            />
          </TopBarContainer>
        </View>


        {/* Content area: loader, empty state, or pager */}
        {feed.length === 0 && (catLoadingBuzz || catLoadingMag) ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.lavenderPurple} />
            <Text style={styles.loadingText}>Loading content...</Text>
          </View>
        ) : feed.length === 0 ? (
          <View style={styles.loader}>
            <Text style={styles.noContentText}>No content available</Text>
          </View>
        ) : isFocused ? (

          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              currentPage === 0 ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={["#997DDF"]}
                  tintColor="#997DDF"
                  title="Refreshing..."
                  titleColor="#fff"
                />
              ) : undefined
            }
          >

            <PagerView
              ref={pagerRef}
              style={styles.pager}
              orientation="vertical"
              initialPage={lastViewedBuzzIndex || 0}
              offscreenPageLimit={1}
              onPageSelected={handlePageSelected}
              overdrag={false}           // prevent edge over-scroll
              pageMargin={0}             // remove slop
              layoutDirection="ltr"      // force LTR
              scrollEnabled={pagerEnabled}
            >
              {feed.map((item, index) => (
                <View key={item.id} style={styles.slide}>
                  {renderContent(item, index)}
                </View>
              ))}
            </PagerView>
          </ScrollView>

        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Content paused</Text>
          </View>
        )}
      </SafeAreaView>

      {/**
       * FIX CONT'D: Render TopBar at the root level (sibling of SafeAreaView) so it sits above
       * PagerView and is not clipped by any parent bounds. This mirrors ArticleScreen where
       * TopBar scrolling works correctly.
       */}
      <TopBarContainer backgroundColor="transparent">
        <TopBar
          tabs={localizedTabs}
          activeTab={activeTab}
          onTabPress={(key) => {
            if (key === "sidebar") setSidebarVisible(true);
            else setActiveTab(key);
          }}
          labelStyle={{ color: "rgba(255,255,255,0.7)" }}
          activeLabelStyle={{ color: "#FFF", fontWeight: "700" }}
        />
      </TopBarContainer>

      {/* Modals */}
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

      <CommentModal
        visible={commentVisible}
        onClose={() => setCommentVisible(false)}
        contentId={selectedContentId || 0}
        contentType="buzz"
      />

      {shareVisible && feed[currentPage] && (
        feed[currentPage].type === "buzz" ? (
          <BuzzShareModal visible={shareVisible} onClose={() => setShareVisible(false)} buzz={feed[currentPage]} />
        ) : feed[currentPage].type === "magazine" ? (
          <MagazineShareModal visible={shareVisible} onClose={() => setShareVisible(false)} magazine={feed[currentPage]} />
        ) : null
      )}
    </View>
  );
};

export default BuzzScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: "#000" },
  pager: { flex: 1 },
  slide: { width: SCREEN_W, height: SCREEN_H, position: "relative" },
  // These styles are for the new image wrapping logic
  imageWrapper: {
    width: SCREEN_W,
    height: SCREEN_H,
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#000", // fallback
  },

  fullscreenImage: {
    width: SCREEN_W,
    height: SCREEN_H,
    resizeMode: "contain", // stretches to fill full height & width
  },

  contentImage: {
    width: "100%",
    aspectRatio: 920 / 1700, // 👈 keep correct proportion (or use media.width/media.height dynamically)
    resizeMode: "cover",
    borderRadius: 0,
  },

  fullScreenGradient: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    height: fh(220),
    zIndex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: { color: "#FFFFFF", marginTop: fh(10), fontSize: ff(16) },
  noContentText: { color: "#FFFFFF", fontSize: ff(16) },
  errorBox: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: fw(20),
  },

  errorText: {
    color: "#fff",
    fontSize: ff(16),
    textAlign: "center",
    includeFontPadding: false, // ✅ ensures full vertical visibility
    textAlignVertical: "center", // ✅ Android fix
    flexWrap: "wrap", // ✅ prevents truncation
    width: "90%", // ✅ ensures wrapping within safe area
  },


  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  placeholderText: { color: "#FFFFFF", marginTop: fh(10), fontSize: ff(14) },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

  },
  topBarWrap: {
    // FIX: Must be positioned for zIndex to apply on Android. This lifts the TopBar
    // above the gradient while keeping it visually pinned at the top.
    position: "absolute",
    top: fh(20),
    left: 0,
    right: 0,
    zIndex: 100, // keep well above overlays to ensure touchability
    // Hide the in-SafeArea TopBar instance; we render one at the root level instead.
    display: "none",
  },
  chipWrapper: {
    position: "absolute",
    top: fh(100),
    left: fw(16),
    zIndex: 15,
  },
  chipButton: {
    paddingHorizontal: fw(8),
    paddingVertical: fh(4),
    borderRadius: fw(20),
    top: fh(20),
  },

  interactionsViewContainer: {
    position: "absolute",
    bottom: fh(10), // dynamic safe area offset
    left: 0,
    right: 0,
    alignItems: "center",      // centers children horizontally
    justifyContent: "center",
    zIndex: 20,                // ensures it's above the image
  },

  interactionsContainer: {
    alignSelf: "center",
    width: fw(277),
  },



  shadowOverlay: {
    // Gradient sits visually below the TopBar but above content.
    // It's non-interactive via pointerEvents="none" in JSX.
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: fh(250), // adjust intensity range
    zIndex: 1,
    opacity: 0.9, // optional global fade (can tweak)
  },

});
