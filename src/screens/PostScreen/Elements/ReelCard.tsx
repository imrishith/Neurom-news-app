// components/ReelCard.tsx
import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Pressable,
  TouchableOpacity,
  Image,
  Platform
} from "react-native";
import Slider from "@react-native-community/slider";
import Video from "react-native-video";
import InteractionRow from "../../../components/InteractionRow";
import { useOnboarding } from "../../../context/OnboardingContext";
import helper from "./helper";
import { fw, fh, ff, fr, getLayoutConfig } from "../../../../utils/responsive";
import ReportModal from "../../../components/Reportreel";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { CONTENT_HEIGHT, BOTTOMBAR_HEIGHT } from "../../../constants/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReelShimmer from "../../../components/shimmers/ReelShimmer";




const { width: ScreenWidth, height: ScreenHeight } = Dimensions.get("window");


const ReelHeight = CONTENT_HEIGHT;

type DebouncedFunction = ((...args: any[]) => void) & { cancel: () => void };

const debounce = (func: (...args: any[]) => void, wait: number): DebouncedFunction => {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as DebouncedFunction;
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  return debounced;
};

interface ReelCardProps {
  video_id: number;
  uri: string;
  _id: string | number;
  index: number;
  title?: string;
  description?: string;
  category?: string;
  category_id?: number;
  backgroundColor?: string;
  isActive: boolean;
  stats?: any;
  thumbnail?: string | null;
  onFinishPlaying?: (index: number) => void;
  onComment?: () => void;
  onShare: () => void;
  onPressCategory?: (categoryId: number) => void;
  getCachedUri?: (video_id: number, url?: string | null) => Promise<string | null>;
  screenFocused: boolean;
}

const ReelCard: React.FC<ReelCardProps> = memo(
  ({
    video_id,
    uri,
    _id,
    index,
    title = "Sample Reel",
    description = "This is a sample description for the reel.",
    category = "General",
    category_id,
    backgroundColor = "black",
    isActive,
    stats,
    thumbnail,
    onFinishPlaying = () => { },
    onComment,
    onShare,
    onPressCategory,
    getCachedUri,
    screenFocused,
  }) => {
    const insets = useSafeAreaInsets();
    const videoPlayerRef = useRef<Video>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [cachedUri, setCachedUri] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
    const singleTapTimeout = useRef<NodeJS.Timeout | null>(null);
    const resumeOnFocusRef = useRef(false);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const likeActionRef = useRef<(() => void) | null>(null);

    const { data } = useOnboarding();
    const lastTap = useRef<number | null>(null);
    const shouldRenderVideo = isActive && screenFocused;
    const fallbackImage = thumbnail || "https://placehold.co/600x800";
    const posterSource = isReady ? undefined : fallbackImage;
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekTime, setSeekTime] = useState(0);

    const handleTogglePlayPause = () => {
      setIsPaused((prev) => !prev);
      setShowPlayPauseIcon(true);
      setTimeout(() => setShowPlayPauseIcon(false), 1200);
    };

    const handleDoubleTap = () => {
      likeActionRef.current?.();
    };

    const handleTap = () => {
      const now = Date.now();

      if (lastTap.current && now - lastTap.current < 300) {
        clearTimeout(singleTapTimeout.current);
        handleDoubleTap();
        lastTap.current = null;
      } else {
        lastTap.current = now;
        singleTapTimeout.current = setTimeout(() => {
          handleTogglePlayPause();
          lastTap.current = null;
        }, 300);
      }
    };

    const handleSeek = (value: number) => {
  if (videoPlayerRef.current) {
    videoPlayerRef.current.seek(value);
    setProgress(value);
    setIsSeeking(false);
  }
};

    useEffect(() => {
      return () => {
        if (singleTapTimeout.current) clearTimeout(singleTapTimeout.current);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      };
    }, []);

    useEffect(() => {
      if (!screenFocused) {
        if (!isPaused) {
          resumeOnFocusRef.current = true;
          setIsPaused(true);
        }
        setShowPlayPauseIcon(false);
        setIsBuffering(false);
        return;
      }

      if (resumeOnFocusRef.current && isActive) {
        setIsPaused(false);
        resumeOnFocusRef.current = false;
      }
    }, [screenFocused, isPaused, isActive]);

    useEffect(() => {
      if (!shouldRenderVideo) {
        setIsBuffering(false);
        setIsReady(false);
      }
    }, [shouldRenderVideo]);

    const formattedStats = React.useMemo(
      () => ({
        likes_count: Number(stats?.likes_count || 0),
        comments_count: Number(stats?.comments_count || 0),
        dislikes_count: Number(stats?.dislikes_count || 0),
        shares_count: Number(stats?.shares_count || 0),
        views_count: Number(stats?.views_count || 0),
        saves_count: Number(stats?.saves_count || 0),
      }),
      [stats]
    );

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const local = await (getCachedUri?.(video_id, uri) ?? Promise.resolve(null));
          if (mounted) setCachedUri(local);
        } catch { }
      })();
      return () => {
        mounted = false;
      };
    }, [getCachedUri, video_id, uri]);

    useEffect(() => {
      if (!isActive && videoPlayerRef.current) {
        videoPlayerRef.current.seek(0);
        setProgress(0);
      }
    }, [isActive]);

    const handleProgress = useMemo(
      () =>
        debounce((data: any) => {
          setProgress(data.currentTime);
        }, 100),
      []
    );

    const handleVideoError = (error: any) => {
      console.error("❌ Video error:", video_id, error);
      setVideoError(true);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        if (isActive) onFinishPlaying(index);
      }, 2000);
    };

    const handleVideoLoad = (data: any) => {
      setDuration(data.duration);
      setVideoError(false);
    };

    const handleReadyForDisplay = () => {
      setIsReady(true);
      setIsBuffering(false);
    };

    useEffect(() => {
      return () => {
        handleProgress.cancel();
      };
    }, [handleProgress]);

        if (!shouldRenderVideo) {
      return (
        <View style={[styles.container, { backgroundColor }]}>
          <Image
            source={{ uri: fallbackImage }}
            style={styles.video}
            resizeMode="cover"
          />
        </View>
      );
    }


      

    return (
      <View style={[styles.container, { backgroundColor }]}>
        {/* 🎥 Video */}
        {!videoError && Boolean(cachedUri || uri) ? (
          <Video
            ref={videoPlayerRef}
            source={{ uri: (cachedUri || uri) as string }}
            style={styles.video}
            resizeMode={"cover"}
            maxBitRate={600000}
            bufferConfig={{
              minBufferMs: 4000,
              maxBufferMs: 12000,
              bufferForPlaybackMs: 800,
              bufferForPlaybackAfterRebufferMs: 1500,
            }}
            useTextureView={false}
            selectedVideoTrack={{ type: 'resolution', value: 360 } as any}
            paused={isPaused}
            muted={isMuted}
            repeat
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="obey"
            controls={false}
            poster={posterSource}
            posterResizeMode="cover"
            onLoadStart={() => {
              setIsBuffering(true);
              setIsReady(false);
            }}
            onReadyForDisplay={handleReadyForDisplay}
            onLoad={handleVideoLoad}
            onProgress={handleProgress}
            onError={handleVideoError}
            onBuffer={(params) => setIsBuffering(params.isBuffering)}
            onEnd={() => onFinishPlaying(index)}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Video unavailable</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setVideoError(false)}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ Gradient overlay for text readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* Tap layer for play/pause */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleTap}
        >
          {showPlayPauseIcon && (
            <View style={styles.centerOverlay}>
              <View style={styles.centerCircle}>
                <Ionicons
                  name={isPaused ? "play" : "pause"}
                  size={fw(getLayoutConfig().isTablet ? 30 : 26)}
                  color="#fff"
                />
              </View>
            </View>
          )}
        </Pressable>

        {/* ✅ Bottom slider - positioned above bottom bar */}
        {isActive && duration > 0 && (
          <View style={[styles.SliderContainer, {bottom:insets.bottom + fh(18)}]}>
            <Slider
              style={{ flex: 1, height: hp('0.5%') }}
              minimumValue={0}
              maximumValue={duration}
              value={progress}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="transparent"
              thumbImage={undefined}
              disabled={false}
              onSlidingStart={() => setIsSeeking(true)}
              onSlidingComplete={handleSeek}
              onValueChange={(value) => {
                if (isSeeking) {
                  setSeekTime(value);
                }
              }}
            />
          </View>
        )}

        {/* ✅ Bottom-left description - above slider */}
        <View style={[styles.bottomLeftDescription, {bottom:insets.bottom + fh(30)}]}>
          <TouchableOpacity
            style={styles.chip}
            activeOpacity={0.8}
            onPress={() => {
              if (category_id && onPressCategory) {
                onPressCategory(category_id);
              }
            }}
          >
            <Text style={styles.chipText}>
              {category?.charAt(0).toUpperCase() + category?.slice(1)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <View>
            <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
              {expanded
                ? description
                : description?.length > 60
                  ? description.slice(0, 60) + "..."
                  : description}
            </Text>
            {description?.length > 60 && (
              <Text
                style={styles.seeMoreLess}
                onPress={() => setExpanded((prev) => !prev)}
              >
                {expanded ? "See less" : "See more"}
              </Text>
            )}
          </View>
        </View>

        {/* ✅ Right-side interactions - aligned with description */}
        {isActive && (
          <View style={[styles.OptionsContainer, {bottom:insets.bottom + fh(30)}]}>
            <InteractionRow
              stats={formattedStats}
              iconSize={fw(getLayoutConfig().isTablet ? 32 : 28)}
              tintColor="#fff"
              compact
              contentType="videos"
              contentId={video_id}
              deviceId={data?.device_id}
              onComment={onComment}
              onShare={onShare}
              onProvideLikeAction={(likeFn) => {
                likeActionRef.current = likeFn;
              }}
              containerStyle={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: hp('1.5%'),
              }}
            />
            <TouchableOpacity
              style={styles.tridotWrap}
              onPress={() => setReportVisible(true)}
            >
              <Image
                source={require("../../../../assets/icons/tridots.png")}
                style={styles.tridotIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}

        <ReportModal
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          contentId={video_id}
          contentType="videos"
        />
      </View>
    );
  }
);

export default ReelCard;

const styles = StyleSheet.create({
  container: {
  width: "100%",
  height: ReelHeight,
  backgroundColor: "black",
  overflow: "hidden",
},

  video: {
    width: "100%",
    height: "100%", // ✅ fills entire container
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "white",
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16),
    marginBottom: fh(10),
  },
  retryButton: {
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 24 : 20),
    paddingVertical: fh(getLayoutConfig().isTablet ? 12 : 10),
    backgroundColor: "#997DDF",
    borderRadius: fw(getLayoutConfig().isTablet ? 24 : 20),
  },
  retryText: {
    color: "white",
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    fontWeight: "600",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 60,
  },
  centerCircle: {
    width: fw(getLayoutConfig().isTablet ? 56 : 50),
    height: fw(getLayoutConfig().isTablet ? 56 : 50),
    borderRadius: fr(getLayoutConfig().isTablet ? 28 : 25),
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ Gradient overlay - makes text readable
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: hp('35%'), // ✅ covers bottom 35% of video
    zIndex: 5,
  },

  // ✅ Slider positioned just above bottom bar
  SliderContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: hp('0.8%'),
    zIndex: 50,
    paddingHorizontal: fw(0),
  },

  // ✅ Bottom description positioned above slider
  bottomLeftDescription: {
    position: "absolute",
    left: fw(getLayoutConfig().isTablet ? 20 : 16),
    right: fw(getLayoutConfig().isTablet ? 100 : 90), // ✅ more space for right icons
    zIndex: 10,
  },
  chip: {
    backgroundColor: "rgba(153,125,223,0.95)",
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 14 : 12),
    paddingVertical: hp('0.6%'),
    borderRadius: fw(getLayoutConfig().isTablet ? 24 : 20),
    marginBottom: hp('0.8%'),
    alignSelf: "flex-start",
  },
  chipText: {
    color: "#fff",
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12),
    fontWeight: "600",
  },
  title: {
    color: "white",
    fontSize: ff(getLayoutConfig().isTablet ? 19 : 17),
    fontWeight: "700",
    marginBottom: hp('0.4%'),
    lineHeight: ff(getLayoutConfig().isTablet ? 24 : 22),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: "white",
    fontSize: ff(getLayoutConfig().isTablet ? 15 : 13),
    fontWeight: "400",
    textAlign: "left",
    lineHeight: ff(getLayoutConfig().isTablet ? 20 : 18),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  seeMoreLess: {
    color: "#fff",
    fontSize: ff(getLayoutConfig().isTablet ? 15 : 13),
    fontWeight: "700",
    marginTop: hp('0.3%'),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ✅ Options positioned on right, aligned with description
  OptionsContainer: {
    position: "absolute",
    right: fw(getLayoutConfig().isTablet ? 16 : 12),
    zIndex: 20,
  },
  tridotWrap: {
    marginTop: hp('1.5%'),
    padding: fw(getLayoutConfig().isTablet ? 10 : 8),
    alignItems: "center",
  },
  tridotIcon: {
    width: fw(getLayoutConfig().isTablet ? 28 : 24),
    height: fw(getLayoutConfig().isTablet ? 28 : 24),
    tintColor: "#fff",
  },
});