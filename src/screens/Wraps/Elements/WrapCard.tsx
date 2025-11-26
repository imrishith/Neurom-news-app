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
import { fw, fh, ff } from "../../../../utils/responsive";
import ReportModal from "../../../components/Reportreel";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { CONTENT_HEIGHT } from "../../../constants/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: ScreenWidth } = Dimensions.get("window");
const WrapHeight = CONTENT_HEIGHT;

interface WrapCardProps {
  video_id: number;
  uri: string;
  _id: string | number;
  index: number;
  title?: string;
  published_at?: string;
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

const WrapCard: React.FC<WrapCardProps> = memo(
  ({
    video_id,
    uri,
    _id,
    index,
    title = "Sample Wrap",
    published_at,
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
    const [reportVisible, setReportVisible] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [cachedUri, setCachedUri] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const singleTapTimeout = useRef<NodeJS.Timeout | null>(null);
    const resumeOnFocusRef = useRef(false);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const likeActionRef = useRef<(() => void) | null>(null);
    const { data } = useOnboarding();
    const lastTap = useRef<number | null>(null);
    const shouldRenderVideo = isActive && screenFocused;
    const fallbackImage = thumbnail || "https://placehold.co/600x800";
    const posterSource = isReady ? undefined : fallbackImage;

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

    // ... (rest of the useEffect and handlers similar to ReelCard)

    const formattedStats = useMemo(
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
        {/* Video Player */}
        {!videoError && Boolean(cachedUri || uri) ? (
          <Video
            ref={videoPlayerRef}
            source={{ uri: (cachedUri || uri) as string }}
            style={styles.video}
            resizeMode={"cover"}
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
            onReadyForDisplay={() => {
              setIsReady(true);
              setIsBuffering(false);
            }}
            onLoad={(data: any) => {
              setDuration(data.duration);
              setVideoError(false);
            }}
            onProgress={(data: any) => setProgress(data.currentTime)}
            onError={() => setVideoError(true)}
            onBuffer={(params: any) => setIsBuffering(params.isBuffering)}
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

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* Tap layer */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleTap}>
          {showPlayPauseIcon && (
            <View style={styles.centerOverlay}>
              <View style={styles.centerCircle}>
                <Ionicons
                  name={isPaused ? "play" : "pause"}
                  size={fw(26)}
                  color="#fff"
                />
              </View>
            </View>
          )}
        </Pressable>

        {/* Progress slider */}
        {isActive && duration > 0 && (
          <View style={[styles.SliderContainer, {bottom: insets.bottom + fh(18)}]}>
            <Slider
              style={{ flex: 1, height: hp('0.5%') }}
              minimumValue={0}
              maximumValue={duration}
              value={progress}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="transparent"
              onSlidingStart={() => setIsSeeking(true)}
              onSlidingComplete={handleSeek}
              onValueChange={(value) => {
                if (isSeeking) {
                  setProgress(value);
                }
              }}
            />
          </View>
        )}

        {/* Bottom content */}
        <View style={[styles.bottomLeftDescription, {bottom: insets.bottom + fh(30)}]}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {published_at && (
            <Text style={styles.publishedAt}>
              {new Date(published_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Right-side interactions */}
        {isActive && (
          <View style={[styles.OptionsContainer, {bottom: insets.bottom + fh(30)}]}>
            <InteractionRow
              stats={formattedStats}
              iconSize={fw(28)}
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

export default WrapCard;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: WrapHeight,
    backgroundColor: "black",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "white",
    fontSize: ff(16),
    marginBottom: fh(10),
  },
  retryButton: {
    paddingHorizontal: fw(20),
    paddingVertical: fh(10),
    backgroundColor: "#997DDF",
    borderRadius: fw(20),
  },
  retryText: {
    color: "white",
    fontSize: ff(14),
    fontWeight: "600",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 60,
  },
  centerCircle: {
    width: fw(50),
    height: fw(50),
    borderRadius: fw(25),
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: hp('35%'),
    zIndex: 5,
  },
  SliderContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: hp('0.8%'),
    zIndex: 50,
  },
  bottomLeftDescription: {
    position: "absolute",
    left: fw(16),
    right: fw(90),
    zIndex: 10,
  },
  title: {
    color: "white",
    fontSize: ff(17),
    fontWeight: "700",
    marginBottom: hp('0.4%'),
    lineHeight: ff(22),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  publishedAt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ff(12),
  },
  OptionsContainer: {
    position: "absolute",
    right: fw(12),
    zIndex: 20,
  },
  tridotWrap: {
    marginTop: hp('1.5%'),
    padding: fw(8),
    alignItems: "center",
  },
  tridotIcon: {
    width: fw(24),
    height: fw(24),
    tintColor: "#fff",
  },
});