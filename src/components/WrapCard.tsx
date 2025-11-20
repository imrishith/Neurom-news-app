// components/dailywraps/DailyWrapCard.tsx
import React, { useEffect, useRef, useState, memo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Pressable,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Video from "react-native-video";
import Slider from "@react-native-community/slider";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fw, fh, ff, fr, getLayoutConfig } from "../../utils/responsive";

const { width: ScreenWidth, height: ScreenHeight } = Dimensions.get("window");

interface DailyWrapCardProps {
  video_id: number;
  uri: string;
  title?: string;
  published_at?: string;
  isActive: boolean;
  thumbnail?: string;
  onFinishPlaying?: (index: number) => void;
  onComment?: () => void;
  onShare?: () => void;
  index: number;
  getCachedUri?: (video_id: number, url?: string) => Promise<string | null>;
}

const DailyWrapCard: React.FC<DailyWrapCardProps> = memo(
  ({
    video_id,
    uri,
    title,
    published_at,
    thumbnail,
    isActive,
    onFinishPlaying,
    onComment,
    onShare,
    getCachedUri,
    index,
  }) => {
    const insets = useSafeAreaInsets();
    const videoRef = useRef<Video>(null);

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [showIcon, setShowIcon] = useState(false);
    const [cachedUri, setCachedUri] = useState<string | null>(null);

    const lastTap = useRef<number | null>(null);

    // Prefetch video cache
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const local = await (getCachedUri?.(video_id, uri) ?? null);
          if (mounted) setCachedUri(local);
        } catch {}
      })();
      return () => { mounted = false; };
    }, [video_id, uri]);

    // Pause when not active
    useEffect(() => {
      if (!isActive) {
        videoRef.current?.seek(0);
        setProgress(0);
      }
    }, [isActive]);

    const handlePress = () => {
      const now = Date.now();
      if (lastTap.current && now - lastTap.current < 300) {
        // double tap (nothing here)
        lastTap.current = null;
      } else {
        lastTap.current = now;
        setTimeout(() => {
          setIsPaused((p) => !p);
          setShowIcon(true);
          setTimeout(() => setShowIcon(false), 1200);
        }, 250);
      }
    };

    return (
      <View style={styles.container}>
        {/* VIDEO */}
        <Video
          ref={videoRef}
          source={{ uri: cachedUri || uri }}
          style={styles.video}
          resizeMode="cover"
          paused={!isActive || isPaused}
          repeat
          onLoad={(e) => {
            setDuration(e.duration);
            setIsReady(true);
          }}
          onBuffer={(b) => setIsBuffering(b.isBuffering)}
          onProgress={(e) => setProgress(e.currentTime)}
          onEnd={() => onFinishPlaying?.(index)}
          poster={thumbnail}
          posterResizeMode="cover"
        />

        {/* Buffering */}
        {isBuffering && (
          <View style={styles.bufferOverlay}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}

        {/* Thumbnail while ready */}
        {!isReady && !!thumbnail && (
          <Image source={{ uri: thumbnail }} style={styles.video} />
        )}

       
      

        {/* Bottom gradient */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.9)"]}
          style={styles.bottomGradient}
        />

        {/* Title + Date */}
        <View style={[styles.textBox, { bottom: insets.bottom + fh(32) }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.date}>
            {published_at ? new Date(published_at).toDateString() : ""}
          </Text>
        </View>

        {/* Right buttons */}
      

        {/* Slider */}
        {duration > 0 && (
          <View style={[styles.sliderBox, { bottom: insets.bottom + fh(16) }]}>
            <Slider
              style={{ width: "100%" }}
              minimumValue={0}
              maximumValue={duration}
              value={progress}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="transparent"
            />
          </View>
        )}
      </View>
    );
  }
);

export default DailyWrapCard;

const styles = StyleSheet.create({
  container: {
    width: ScreenWidth,
    height: ScreenHeight,
    backgroundColor: "#000",
  },
  video: { width: "100%", height: "100%", position: "absolute" },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "35%",
    zIndex: 5,
  },
  textBox: { 
    position: "absolute", 
    left: getLayoutConfig().contentPadding, 
    zIndex: 10,
    maxWidth: "80%",
  },
  title: {
    color: "#fff",
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
    fontWeight: "700",
    marginBottom: fh(getLayoutConfig().isTablet ? 6 : 4),
    includeFontPadding: false,
  },
  date: { 
    color: "#ddd", 
    fontSize: ff(getLayoutConfig().isTablet ? 15 : 13),
    includeFontPadding: false,
  },
  rightOptions: {
    position: "absolute",
    right: getLayoutConfig().contentPadding,
    zIndex: 10,
    alignItems: "center",
    gap: fh(getLayoutConfig().isTablet ? 16 : 12),
  },
  sliderBox: {
    position: "absolute",
    width: "100%",
    paddingHorizontal: getLayoutConfig().contentPadding,
    zIndex: 50,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: fw(getLayoutConfig().isTablet ? 65 : 55),
    height: fw(getLayoutConfig().isTablet ? 65 : 55),
    borderRadius: fr(getLayoutConfig().isTablet ? 45 : 40),
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
});
