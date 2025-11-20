import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Dimensions,
  View,
  StyleSheet,
  Text,
  FlatList,
  ListRenderItemInfo,
  RefreshControl   
} from "react-native";
import WrapCard from "./WrapCard";
import CommentModal from "../../../components/CommentModal";
import { useOnboarding } from "../../../context/OnboardingContext";
import ReelShareModal from "../../../components/share/reel/ReelShareModal";
import useVideoCacheManager from "../../../hooks/useVideoCacheManager";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { fw, fh, ff, getLayoutConfig } from "../../../../utils/responsive";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

export type WrapItem = {
  video_id: number;
  _id?: string | number;
  uri: string;
  title_en?: string;
  title_te?: string;
  title?: string;
  thumbnail?: string | null;
  published_at?: string;
  stats?: any;
};

interface DailyWrapsProps {
  videos?: WrapItem[];
  initialIndex?: number;
  onNearEnd?: (index: number) => void;
  onIndexChange?: (index: number) => void;
  onPressCategory?: (categoryId: number) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

function DailyWraps({
  videos = [],
  initialIndex = 0,
  onNearEnd,
  onIndexChange,
  onPressCategory,
  refreshing = false,
  onRefresh,
}: DailyWrapsProps) {
  const [currentPage, setCurrentPage] = useState(initialIndex);
  const [commentVisible, setCommentVisible] = useState(false);
  const [selectedWrapId, setSelectedWrapId] = useState<number | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [selectedWrap, setSelectedWrap] = useState<any | null>(null);
  const { data } = useOnboarding();
  const listRef = useRef<FlatList<WrapItem> | null>(null);
  const screenFocused = useIsFocused();
  const focusRef = useRef(screenFocused);
  const viewabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollFailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    focusRef.current = screenFocused;
  }, [screenFocused]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (viewabilityTimeoutRef.current) clearTimeout(viewabilityTimeoutRef.current);
      if (scrollFailTimeoutRef.current) clearTimeout(scrollFailTimeoutRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      focusRef.current = true;
      return () => {
        focusRef.current = false;
        if (viewabilityTimeoutRef.current) clearTimeout(viewabilityTimeoutRef.current);
      };
    }, [])
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const safeVideos = useMemo(() => videos || [], [videos]);

  // Cache manager
  const { getCachedUri, prefetchNextVideos } = useVideoCacheManager(safeVideos as any);

  const safePrefetch = useCallback(
    (index: number) => {
      if (!focusRef.current || safeVideos.length === 0) return;
      const target = Math.max(0, Math.min(index, safeVideos.length - 1));
      prefetchNextVideos(target, 2);
    },
    [prefetchNextVideos, safeVideos.length]
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index?: number }> }) => {
      if (!viewableItems?.length || !focusRef.current) return;
      if (viewabilityTimeoutRef.current) clearTimeout(viewabilityTimeoutRef.current);

      viewabilityTimeoutRef.current = setTimeout(() => {
        const idx = viewableItems[0]?.index ?? 0;
        setCurrentPage(idx);
        onIndexChange?.(idx);

        if (onNearEnd && idx >= Math.max(0, safeVideos.length - 3)) {
          onNearEnd(idx);
        }
        safePrefetch(idx);
      }, 90);
    },
    [onIndexChange, onNearEnd, safePrefetch, safeVideos.length]
  );

  const handleShare = useCallback((wrap: any) => {
    setSelectedWrap(wrap);
    setShareVisible(true);
  }, []);

  const handleCommentPress = useCallback((videoId: number) => {
    setSelectedWrapId(videoId);
    setCommentVisible(true);
  }, []);

  const handleFinishPlaying = useCallback(
    (index: number) => {
      if (!focusRef.current) return;
      const next = Math.min(index + 1, safeVideos.length - 1);
      if (next === index) return;

      setCurrentPage(next);
      onIndexChange?.(next);

      if (onNearEnd && next >= Math.max(0, safeVideos.length - 3)) {
        onNearEnd(next);
      }

      listRef.current?.scrollToIndex({ index: next, animated: false });
      safePrefetch(next);
    },
    [safeVideos.length, onNearEnd, onIndexChange, safePrefetch]
  );

  // Jump to correct index
  useEffect(() => {
    if (!listRef.current || safeVideos.length === 0) return;
    try {
      listRef.current.scrollToIndex({
        index: Math.max(0, Math.min(initialIndex, safeVideos.length - 1)),
        animated: false,
        viewPosition: 0,
      });
    } catch (err) {
      console.warn("[DailyWraps] scrollToIndex failed:", err.message);
    }
  }, [initialIndex, safeVideos.length]);

  // Prefetch on mount
  useEffect(() => {
    if (safeVideos.length === 0) return;
    safePrefetch(Math.max(0, Math.min(initialIndex, safeVideos.length - 1)));
  }, [safeVideos.length, initialIndex, safePrefetch]);

  useEffect(() => {
    if (safeVideos.length === 0) return;
    safePrefetch(currentPage);
  }, [currentPage, safePrefetch, safeVideos.length]);

  if (!safeVideos || safeVideos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: "#fff" }}>No wraps available</Text>
      </View>
    );
  }

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<WrapItem>) => {
      const isActive = screenFocused && index === currentPage;
      const title = data.language_code === "te" ? (item.title_te || item.title) : (item.title_en || item.title);

      return (
        <View style={styles.page}>
          <View style={{ flex: 1 }}>
            <WrapCard
              video_id={item.video_id}
              uri={typeof item.uri === "string" ? item.uri : (item as any)?.uri?.uri || ""}
              _id={item._id ?? item.video_id}
              index={index}
              title={title}
              published_at={item.published_at}
              stats={item.stats}
              thumbnail={item.thumbnail}
              isActive={isActive}
              screenFocused={screenFocused}
              onFinishPlaying={handleFinishPlaying}
              onComment={() => handleCommentPress(item.video_id)}
              onShare={() => handleShare(item)}
              onPressCategory={onPressCategory}
              getCachedUri={getCachedUri}
            />
          </View>
        </View>
      );
    },
    [
      screenFocused,
      currentPage,
      data.language_code,
      handleFinishPlaying,
      handleCommentPress,
      handleShare,
      onPressCategory,
      getCachedUri,
    ]
  );

  const keyExtractor = useCallback((item: WrapItem) => String(item.video_id), []);

  const handleMomentumEnd = useCallback(
    (e: any) => {
      if (!focusRef.current) return;
      const index = Math.max(0, Math.round(e.nativeEvent.contentOffset.y / SCREEN_H));
      if (index !== currentPage) {
        setCurrentPage(index);
        onIndexChange?.(index);
      }
      safePrefetch(index);
      if (onNearEnd && index >= Math.max(0, safeVideos.length - 3)) {
        onNearEnd(index);
      }
    },
    [currentPage, onIndexChange, onNearEnd, safePrefetch, safeVideos.length]
  );

  const handleScrollToIndexFailed = useCallback((info: { index: number }) => {
    if (scrollFailTimeoutRef.current) clearTimeout(scrollFailTimeoutRef.current);
    scrollFailTimeoutRef.current = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: false });
    }, 200);
  }, []);

  return (
    <>
      <FlatList
        ref={listRef}
        data={safeVideos}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews={true}
        windowSize={3}
        maxToRenderPerBatch={1}
        updateCellsBatchingPeriod={16}
        initialNumToRender={1}
        initialScrollIndex={Math.max(0, Math.min(initialIndex, safeVideos.length - 1))}
        disableIntervalMomentum={true}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={handleViewableItemsChanged}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#997DDF"]}
            tintColor="#997DDF"
          />
        }
      />

      {selectedWrapId && (
        <CommentModal
          visible={commentVisible}
          onClose={() => setCommentVisible(false)}
          contentId={selectedWrapId}
          contentType="videos"
        />
      )}

      <ReelShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        reel={selectedWrap}
      />
    </>
  );
}

export default React.memo(DailyWraps);

const styles = StyleSheet.create({
  page: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: "#000",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});