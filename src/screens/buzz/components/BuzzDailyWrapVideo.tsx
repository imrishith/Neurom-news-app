import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Video from "react-native-video";
import LinearGradient from "react-native-linear-gradient";
import { fw, fh } from "../../../../utils/responsive";

type Props = {
  item: any;
  isActive: boolean;
  onPagerToggle: (enabled: boolean) => void;
  speedMbps: number | null;
  imageHeight: number;
};

const pickVariantUrl = (
  variants?: Record<string, string>,
  mbps?: number | null
): string | null => {
  if (!variants) return null;

  // 1) Pick HLS based on internet speed
  if (typeof mbps === "number") {
    if (mbps > 5 && variants["hls_1080p"]) return variants["hls_1080p"];
    if (mbps > 2 && variants["hls_720p"]) return variants["hls_720p"];
    if (variants["hls_480p"]) return variants["hls_480p"];
  }

  // 2) If speed unknown → choose best available HLS
  if (variants["hls_720p"]) return variants["hls_720p"];
  if (variants["hls_480p"]) return variants["hls_480p"];
  if (variants["hls_1080p"]) return variants["hls_1080p"];

  // 3) FINAL fallback → mp4 is NOT allowed, so return null
  return null;
};


const BuzzDailyWrapVideo: React.FC<Props> = ({ item, isActive, onPagerToggle, speedMbps, imageHeight }) => {
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const uri = useMemo(() => pickVariantUrl(item?.media?.variants, speedMbps), [item?.media?.variants, speedMbps]);

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
        controls={false}
        progressUpdateInterval={250}
        onProgress={(e) => setPosition(Math.max(0, e?.currentTime || 0))}
        onLoad={(e) => {
          setIsBuffering(false);
          onPagerToggle(true);
          setDuration(Math.max(0, e?.duration || 0));
        }}
        onBuffer={(e) => {
          const buffering = !!e?.isBuffering;
          setIsBuffering(buffering);
          onPagerToggle(!buffering);
        }}
        onLoadStart={() => {
          setIsBuffering(true);
          onPagerToggle(false);
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
        {!!item.title && <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{item.title}</Text>}
      </View>
      {isBuffering && (
        <View style={styles.placeholder} pointerEvents="none">
          <Text style={styles.placeholderText}>Loading...</Text>
        </View>
      )}

      {/* Controls: Play/Pause button */}
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setIsPaused((p) => !p)}
          style={{
            width: fw(56),
            height: fw(56),
            borderRadius: fw(28),
            backgroundColor: "#00000080",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{isPaused ? "▶" : "❚❚"}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={{ position: "absolute", left: fw(12), right: fw(12), bottom: fh(10) }} pointerEvents="none">
        <View style={{ height: 3, backgroundColor: "#FFFFFF40", borderRadius: 2, overflow: "hidden" }}>
          <View
            style={{
              height: 3,
              width: `${duration > 0 ? Math.min(100, (position / duration) * 100) : 0}%`,
              backgroundColor: "#FFFFFF",
            }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageWrapper: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#000",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  fullScreenGradient: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    height: fh(220),
    zIndex: 1,
  },
  placeholder: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#FFFFFF", marginTop: fh(10), fontSize: 14 },
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
    fontSize: 16,
    textAlign: "center",
  },
});

export default React.memo(BuzzDailyWrapVideo);

