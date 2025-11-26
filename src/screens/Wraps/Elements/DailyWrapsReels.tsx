import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  Dimensions,
  View,
  StyleSheet,
  Text,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
} from "react-native";
import WrapCard from "../../../components/WrapCard";
import CommentModal from "../../../components/CommentModal";
import { useOnboarding } from "../../../context/OnboardingContext";
import ReelShareModal from "../../../components/share/reel/ReelShareModal";
import useVideoCacheManager from "../../../hooks/useVideoCacheManager";
import { useIsFocused } from "@react-navigation/native";


const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

export type WrapItem = {
  video_id: number; // mapped from wrap_id
  _id?: string | number;
  uri: string;
  title_en?: string;
  title_te?: string;
  title?: string;
  thumbnail?: string | null;
  published_at?: string;
  stats?: any;
};

type DailyWrapsReelsProps = {
  videos?: WrapItem[];
  initialIndex?: number;
  onNearEnd?: (index: number) => void;
  onIndexChange?: (index: number) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

function DailyWrapsReels({
  videos = [],
  initialIndex = 0,
  onNearEnd,
  onIndexChange,
  refreshing = false,
  onRefresh,
}: DailyWrapsReelsProps) {
  const [currentPage, setCurrentPage] = useState(initialIndex);
  const [commentVisible, setCommentVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [selectedWrap, setSelectedWrap] = useState<any | null>(null);
  const { data } = useOnboarding();
  const listRef = useRef<FlatList<WrapItem> | null>(null);
  const screenFocused = useIsFocused();

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const safeVideos = useMemo(() => videos || [], [videos]);

  // Cache manager to lookup cached paths and prefetch ahead
  const { getCachedUri, prefetchNextVideos } = useVideoCacheManager(safeVideos as any);

  const handleShare = useCallback((wrap: any) => {
    setSelectedWrap(wrap);
    setShareVisible(true);
  }, []);

  const handleCommentPress = useCallback((id: number) => {
    setSelectedId(id);
    setCommentVisible(true);
  }, []);

  const handleFinishPlaying = useCallback(
    (index: number) => {
      const next = index + 1;
      if (index < safeVideos.length - 1) {
        setCurrentPage(next);
        onIndexChange?.(next);

        if (onNearEnd && next >= Math.max(0, safeVideos.length - 3)) {
          onNearEnd(next);
        }

        listRef.current?.scrollToIndex({ index: next, animated: false });
      }
    },
    [safeVideos.length, onNearEnd, onIndexChange]
  );

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };



  const onViewableItemsChanged = useRef(
    debounce(({ viewableItems }: { viewableItems: Array<{ index?: number }> }) => {
      if (!viewableItems?.length) return;
      const idx = viewableItems[0]?.index ?? 0;
      setCurrentPage(idx);
      onIndexChange?.(idx);
      if (onNearEnd && idx >= Math.max(0, safeVideos.length - 3)) {
        onNearEnd(idx);
      }
    }, 120)
  ).current;

  React.useEffect(() => {
    if (!listRef.current || safeVideos.length === 0) return;
    try {
      listRef.current.scrollToIndex({
        index: Math.max(0, Math.min(initialIndex, safeVideos.length - 1)),
        animated: false,
        viewPosition: 0,
      });
    } catch (err: any) {
      console.warn("scrollToIndex failed:", err.message);
    }
  }, [initialIndex, safeVideos.length]);

  React.useEffect(() => {
    if (safeVideos.length > 0) {
      const startIndex = Math.max(0, Math.min(initialIndex, safeVideos.length - 1));
      prefetchNextVideos(startIndex);
    }
  }, [prefetchNextVideos, safeVideos.length, initialIndex]);

  // Prefetch next thumbnails for smooth visual handoff
  React.useEffect(() => {
    const next = safeVideos[currentPage + 1];
    const next2 = safeVideos[currentPage + 2];
    [next, next2].forEach((v) => {
      if (v?.thumbnail) {
        // @ts-ignore
        const ImageRef = (global as any).Image || require("react-native").Image;
        ImageRef?.prefetch?.(v.thumbnail);
      }
    });
  }, [currentPage, safeVideos]);

  if (!safeVideos || safeVideos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: "#fff" }}>No wraps available</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: ListRenderItemInfo<WrapItem>) => {
    const isActive = index === currentPage;
    const title = data.language_code === "te" ? (item.title_te || item.title) : (item.title_en || item.title);

    return (

      <View style={{ flex: 1 }}>
        <WrapCard
          video_id={item.video_id}
          uri={typeof item.uri === "string" ? item.uri : (item as any)?.uri?.uri || ""}
          _id={item._id ?? item.video_id}
          index={index}
          title={title}
          published_at={item.published_at}
          stats={item.stats}
          isActive={screenFocused && index === currentPage}
          screenFocused={screenFocused}
          onFinishPlaying={handleFinishPlaying}
          onComment={() => handleCommentPress(item.video_id)}
          onShare={() => handleShare(item)}
          getCachedUri={getCachedUri}
        />
      </View>
    );
  };

  return (
    <>
      <FlatList
        ref={listRef}
        data={safeVideos}
        keyExtractor={(it) => String(it.video_id)}
        renderItem={renderItem}
        horizontal={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews
        windowSize={2}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        initialScrollIndex={Math.max(0, Math.min(initialIndex, safeVideos.length - 1))}
        disableIntervalMomentum
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / SCREEN_H);
          setCurrentPage(index);
          onIndexChange?.(index);
          prefetchNextVideos(index);
        }}
        getItemLayout={(_, index) => ({ length: SCREEN_H, offset: SCREEN_H * index, index })}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 300);
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#997DDF"]}
            tintColor="#997DDF"
          />
        }
      />

      {selectedId && (
        <CommentModal
          visible={commentVisible}
          onClose={() => setCommentVisible(false)}
          contentId={selectedId}
          contentType="videos"
        />
      )}

      <ReelShareModal visible={shareVisible} onClose={() => setShareVisible(false)} reel={selectedWrap} />
    </>
  );
}


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

export default DailyWrapsReels;