// components/dailywraps/DailyWrapCard.tsx
import React, { useEffect, useRef, useState, memo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import Video from "react-native-video";
import Slider from "@react-native-community/slider";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { fw, fh, ff } from "../../utils/responsive";
import { useBottomBarHeight } from "../../utils/layoutUtils";
import { useIsFocused } from "@react-navigation/native";

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
    getCachedUri,
    index,
  }) => {
    const insets = useSafeAreaInsets();
    const safeHeight = ScreenHeight - insets.top - insets.bottom;
    const videoRef = useRef<Video>(null);

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [cachedUri, setCachedUri] = useState<string | null>(null);

    const [showIcon, setShowIcon] = useState(false);
    const lastTap = useRef<number | null>(null);

    // Load cached URL
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const local = await (getCachedUri?.(video_id, uri) ?? null);
          if (mounted) setCachedUri(local);
        } catch { }
      })();
      return () => {
        mounted = false;
      };
    }, [video_id, uri]);

    // When not active → reset
    useEffect(() => {
      if (!isActive) {
        videoRef.current?.seek(0);
        setProgress(0);
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    }, [isActive]);

    // Fullscreen tap handler
    const handlePress = () => {
      const now = Date.now();
      if (lastTap.current && now - lastTap.current < 300) {
        // double tap – reserved
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
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={[styles.container, { height: safeHeight }]}>
          {/* 🎥 VIDEO */}
          <Video
            ref={videoRef}
            source={{ uri: cachedUri || uri }}
            style={[styles.video, { height: safeHeight - insets.top + fh(10) }]}
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

          {/* 💠 FULLSCREEN TAP LAYER */}
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handlePress}
          >
            {showIcon && (
              <View style={styles.centerOverlay}>
                <View style={styles.circle}>
                  <Ionicons
                    name={isPaused ? "play" : "pause"}
                    size={fw(30)}
                    color="#fff"
                  />
                </View>
              </View>
            )}
          </Pressable>

          {/* ⏳ BUFFER LOADER */}
          {isBuffering && (
            <View style={styles.bufferOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {/* 📷 FALLBACK IMAGE BEFORE READY */}
          {!isReady && !!thumbnail && (
            <Image source={{ uri: thumbnail }} style={styles.video} />
          )}

          {/* 🌈 BOTTOM GRADIENT */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.9)"]}
            style={styles.bottomGradient}
          />

          {/* 📝 TITLE + DATE */}
          <View style={[styles.textBox, { bottom: insets.bottom + fh(60) }]}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.date}>
              {published_at ? new Date(published_at).toDateString() : ""}
            </Text>
          </View>

          {/* 🎚️ SLIDER */}
          {duration > 0 && (
            <View style={[styles.sliderBox, { bottom: insets.bottom + fh(40) }]}>
              <Slider
                style={{ width: "100%" }}
                minimumValue={0}
                maximumValue={duration}
                value={progress}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="transparent"
                onSlidingComplete={(v) => {
                  videoRef.current?.seek(v);
                  setProgress(v);
                }}
              />
            </View>
          )}
        </View>
      </View>
    );
  }
);

export default DailyWrapCard;

const styles = StyleSheet.create({
  container: {
    width: ScreenWidth,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
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
    left: fw(16),
    zIndex: 10,
  },
  title: {
    color: "#fff",
    fontSize: ff(18),
    fontWeight: "700",
    marginBottom: fh(4),
  },
  date: {
    color: "#ddd",
    fontSize: ff(13),
  },
  sliderBox: {
    position: "absolute",
    width: "100%",
    paddingHorizontal: fw(10),
    zIndex: 15,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: fw(55),
    height: fw(55),
    borderRadius: fw(40),
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
});
