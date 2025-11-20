import React, { forwardRef } from "react";
import {
  FlatList,
  View,
  ViewStyle,
  StyleSheet,
  ListRenderItemInfo,
} from "react-native";
import { fw, fh } from "../../utils/responsive";

interface CarouselProps<T> {
  data: T[];
  renderItem: (info: ListRenderItemInfo<T>) => React.ReactElement;
  keyExtractor?: (item: T, index: number) => string;
  horizontal?: boolean;
  style?: ViewStyle;
  itemSpacing?: number;
  contentContainerStyle?: ViewStyle;
  showsScrollIndicator?: boolean;
  snapToInterval?: number;
  pagingEnabled?: boolean;
  // Virtualization tuning (passed to FlatList)
  windowSize?: number;
  maxToRenderPerBatch?: number;
  initialNumToRender?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number };
  onScrollToIndexFailed?: (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => void;
}

// ✅ forwardRef so parent can call scrollToIndex/scrollToOffset
function InnerCarousel<T>(
  {
    data,
    renderItem,
    keyExtractor = (_, i) => i.toString(),
    horizontal = true,
    style,
    itemSpacing = fw(16),
    contentContainerStyle,
    showsScrollIndicator = false,
    snapToInterval,
    pagingEnabled = false,
    windowSize = 5,
    maxToRenderPerBatch = 5,
    initialNumToRender = 5,
    removeClippedSubviews = true,
    getItemLayout,
    onScrollToIndexFailed,
  }: CarouselProps<T>,
  ref: React.Ref<FlatList<T>>
) {
  return (
    <View style={[styles.wrapper, style]}>
      <FlatList
        ref={ref}
        data={data}
        horizontal={horizontal}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={horizontal && showsScrollIndicator}
        showsVerticalScrollIndicator={!horizontal && showsScrollIndicator}
        contentContainerStyle={[
          { paddingHorizontal: itemSpacing },
          contentContainerStyle,
        ]}
        ItemSeparatorComponent={() =>
          horizontal ? (
            <View style={{ width: itemSpacing }} />
          ) : (
            <View style={{ height: itemSpacing }} />
          )
        }
        // Accept pixel value from caller as-is (they can use fw/fh outside)
        snapToInterval={snapToInterval}
        pagingEnabled={pagingEnabled}
        windowSize={windowSize}
        maxToRenderPerBatch={maxToRenderPerBatch}
        initialNumToRender={initialNumToRender}
        removeClippedSubviews={removeClippedSubviews}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed as any}
      />
    </View>
  );
}

const Carousel = forwardRef(InnerCarousel) as <T>(
  props: CarouselProps<T> & { ref?: React.Ref<FlatList<T>> }
) => React.ReactElement;

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 0,
  },
});

export default Carousel;
