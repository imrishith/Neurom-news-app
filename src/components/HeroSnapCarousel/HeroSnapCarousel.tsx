import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ImageBackground,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { fw, fh, ff } from '../../../utils/responsive';

export type HeroItem = {
  id: string | number;
  image: any;           // require(...) or { uri }
  title?: string;
  subtitle?: string;
  metaText?: string;
  payload?: any;
};

type Props = {
  data: HeroItem[];
  gap?: number;
  radius?: number;
  onSnapToItem?: (index: number) => void;
  onPressItem?: (item: HeroItem, index: number) => void;

  showBottomGradient?: boolean;
  showTopGradient?: boolean;
  showDimOverlay?: boolean;

  renderRight?: (item: HeroItem, index: number) => React.ReactNode;
  renderTitle?: (item: HeroItem, index: number) => React.ReactNode;
  showMetaChip?: boolean;

  cardWidthPct?: number;
  aspectRatio?: number;
  peekMultiplier?: number;

  rightSlotPlacement?: 'right' | 'left' | 'below';
  rightSlotStyle?: ViewStyle;

  renderTopLeft?: (item: HeroItem, index: number) => React.ReactNode;
  renderTopRight?: (item: HeroItem, index: number) => React.ReactNode;
  renderBottomLeft?: (item: HeroItem, index: number) => React.ReactNode;
  renderBottomRight?: (item: HeroItem, index: number) => React.ReactNode;

  slotTopLeftStyle?: ViewStyle;
  slotTopRightStyle?: ViewStyle;
  slotBottomLeftStyle?: ViewStyle;
  slotBottomRightStyle?: ViewStyle;
};

export default function HeroSnapCarousel({
  data,
  gap = 12,
  radius = 12,
  onSnapToItem,
  onPressItem,
  showBottomGradient = true,
  showTopGradient = true,
  showDimOverlay = false,
  renderRight,
  renderTitle,
  showMetaChip = true,
  cardWidthPct = 0.8,
  aspectRatio,
  peekMultiplier = 1,
  rightSlotPlacement = 'right',
  rightSlotStyle,
  renderTopLeft,
  renderTopRight,
  renderBottomLeft,
  renderBottomRight,
  slotTopLeftStyle,
  slotTopRightStyle,
  slotBottomLeftStyle,
  slotBottomRightStyle,
}: Props) {
  const { width: screenW } = useWindowDimensions();

  const GAP = fw(gap);
  const RADIUS = fw(radius);

  const CARD_W = Math.round(screenW * cardWidthPct);
  const CARD_H = aspectRatio ? Math.round(CARD_W / aspectRatio) : fh(221);

  const SNAP_INTERVAL = CARD_W + GAP;
  const SIDE_SPACER = Math.round((screenW - CARD_W) / 3);

  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<HeroItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndexRef = useRef(0);

  const keyExtractor = (item: HeroItem) => String(item.id);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index === lastIndexRef.current) {
      return;
    }
    lastIndexRef.current = index;
    setActiveIndex(index);
    onSnapToItem?.(index);
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<HeroItem>) => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    // Fixed animations - use the same scale for both axes to maintain aspect ratio
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.9],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 0, 0.7], // Reduced from 30 to 10 for less vertical movement
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.8], // Increased from 0.7 to 0.8 for better visibility
      extrapolate: 'clamp',
    });

    const RightSlot = renderRight?.(item, index);

    const isBelow = rightSlotPlacement === 'below';
    const isLeft = rightSlotPlacement === 'left';

    const bottomRowBase = {
      position: 'absolute' as const,
      left: fw(12),
      right: fw(16),
      bottom: fh(16),
    };

    const bottomRowStyle = isBelow
      ? [{ ...bottomRowBase, flexDirection: 'column', alignItems: 'flex-start' }]
      : [{ ...bottomRowBase, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }];

    const titleStyle = {
      flexGrow: 1,
      flexShrink: 1,
      marginRight: isLeft ? 0 : fw(10),
      marginLeft: isLeft ? fw(10) : 0,
      marginTop: fh(2),
      color: '#fff',
      fontSize: ff(12),
    };

    const rightSlotWrapperStyle = [
      { alignSelf: isBelow ? 'flex-start' : 'center' },
      isBelow ? { marginTop: fh(8) } : null,
      rightSlotStyle,
    ];

    return (
      <View style={{ width: SNAP_INTERVAL }}>
        <Animated.View
          style={[
            styles.shadowWrap,
            {
              width: CARD_W,
              height: CARD_H,
              borderRadius: RADIUS,
              transform: [{ scale }, { translateY }], // Removed separate scaleY
              opacity,
              shadowColor: 'none',
              shadowOpacity: 0.55,
              shadowRadius: fw(16),
              shadowOffset: { width: 0, height: fh(8) },
              elevation: Math.max(4, Math.round(fw(10))),
              backgroundColor: 'none',
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPressItem?.(item, index)}
            style={{ borderRadius: RADIUS, overflow: 'hidden', width: '100%', height: '100%' }}
          >
            <ImageBackground
              source={item.image}
              style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
              imageStyle={{ borderRadius: RADIUS }}
              resizeMode="cover"
            >
              {showTopGradient && (
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)']}
                  locations={[0.0, 0.2927]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[styles.topShade, { opacity: 0.6 }]}   // 👈 overall fade
                />

              )}

              {showBottomGradient && (
                <LinearGradient
                  colors={[
                    'rgba(0,0,0,0)',      // top: fully transparent
                    'rgba(0,0,0,0.9)',    // bottom: 80% opacity
                  ]}
                  locations={[0.3, 0.95]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.bottomShade}
                />

              )}

              {showDimOverlay && <View style={styles.dimOverlay} />}

              {renderTopLeft && (
                <View style={[styles.slotTL, slotTopLeftStyle]} pointerEvents="box-none">
                  {renderTopLeft(item, index)}
                </View>
              )}

              {showMetaChip && !!item.metaText && !renderTopRight && (
                <View style={styles.metaChip}>
                  <Text numberOfLines={1} style={styles.metaText}>
                    {item.metaText}
                  </Text>
                </View>
              )}
              {renderTopRight && (
                <View style={[styles.slotTR, slotTopRightStyle]} pointerEvents="box-none">
                  {renderTopRight(item, index)}
                </View>
              )}

              {renderBottomLeft && (
                <View style={[styles.slotBL, slotBottomLeftStyle]} pointerEvents="box-none">
                  {renderBottomLeft(item, index)}
                </View>
              )}
              {renderBottomRight && (
                <View style={[styles.slotBR, slotBottomRightStyle]} pointerEvents="box-none">
                  {renderBottomRight(item, index)}
                </View>
              )}

              <View style={bottomRowStyle as any}>
                {isLeft && RightSlot ? (
                  <>
                    <View style={rightSlotWrapperStyle}>{RightSlot}</View>
                    <Text numberOfLines={2} ellipsizeMode="tail" style={titleStyle as any}>
                      {renderTitle ? (renderTitle(item, index) as any) : item.title}
                    </Text>
                  </>
                ) : isBelow ? (
                  <>
                    <Text numberOfLines={2} ellipsizeMode="tail" style={titleStyle as any}>
                      {renderTitle ? (renderTitle(item, index) as any) : item.title}
                    </Text>
                    {RightSlot && <View style={rightSlotWrapperStyle}>{RightSlot}</View>}
                  </>
                ) : (
                  <>
                    <Text numberOfLines={3} ellipsizeMode="tail" style={titleStyle as any}>
                      {renderTitle ? (renderTitle(item, index) as any) : item.title}
                    </Text>
                    {RightSlot && <View style={rightSlotWrapperStyle}>{RightSlot}</View>}
                  </>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: Math.round(SIDE_SPACER * peekMultiplier) }),
    [SIDE_SPACER, peekMultiplier],
  );

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.FlatList
        ref={listRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate={Platform.select({ ios: 0, android: 0.98 }) as any}
        bounces={false}
        disableIntervalMomentum
        contentContainerStyle={contentContainerStyle}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        initialNumToRender={5}
        windowSize={10}
        maxToRenderPerBatch={5}
        removeClippedSubviews
        getItemLayout={(_, i) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * i,
          index: i,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    marginHorizontal: fw(8),
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  topShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '70%',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  slotTL: { position: 'absolute', top: fh(8), left: fw(8), zIndex: 20 },
  slotTR: { position: 'absolute', top: fh(8), right: fw(8), zIndex: 20 },
  slotBL: { position: 'absolute', bottom: fh(56), left: fw(12), zIndex: 20 },
  slotBR: { position: 'absolute', bottom: fh(50), right: fw(16), zIndex: 20 },
  metaChip: {
    position: 'absolute',
    top: fh(8),
    right: fw(8),
    paddingHorizontal: fw(10),
    paddingVertical: fh(6),
    borderRadius: fw(12),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  metaText: {
    color: '#fff',
    fontSize: ff(12),
    fontFamily: 'AnekTelugu-SemiBold',
  },
});
