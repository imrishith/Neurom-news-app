// screens/Article/ArticleAudioMode.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  InteractionManager,
} from "react-native";
import Slider from "@react-native-community/slider";
import TrackPlayer, {
  State,
  usePlaybackState,
  useProgress,
  Event,
  Capability,
} from "react-native-track-player";
import Button from "../../components/Button";
import SaveButton from "../../components/SaveButton";
import InteractionsRow from "../../components/InteractionRow";
import UpcomingArticlesCarousel from "../AudioScreen/UpcomingArticlesCarousel";
import { fw, fh, ff } from "../../../utils/responsive";
import { useArticlesStore } from "../../../utils/store/useArticlesStore";
import { useOnboarding } from "../../context/OnboardingContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { shareToWhatsApp } from "../../../utils/shareUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const BUTTON_HEIGHT = fh(28);

interface ArticleAudioModeProps {
  article: any;
  onPressCategory?: (categoryId: number) => void;
  index: number;
  totalPosts: number;
  colors: any;
  t: (key: string) => string;
  getFont: (weight?: "bold" | "medium" | "regular" | "semibold") => string;
  getLangCode: () => string;
  deviceId?: string;
  onReport: () => void;
  onShare: () => void;
  onComment: () => void;
  onToggleMode: (isTextMode: boolean) => void;
  isTextMode: boolean;
  activeTab: any;
  posts: any[];
  currentIndex: number;
  onSelectArticle: (article: any, index: number) => void;
  modeSwitchVersion: number;
  stats: any;
  CONTENT_HEIGHT: number;
  TOP_BAR_HEIGHT: number;
}

const ArticleAudioMode: React.FC<ArticleAudioModeProps> = ({
  article,
  onPressCategory,
  index,
  totalPosts,
  colors,
  t,
  getFont,
  getLangCode,
  deviceId,
  onReport,
  onShare,
  onComment,
  onToggleMode,
  isTextMode,
  activeTab,
  posts,
  currentIndex,
  onSelectArticle,
  modeSwitchVersion,
  stats,
  CONTENT_HEIGHT,
  TOP_BAR_HEIGHT,

}) => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const progressPositionRef = useRef(progress.position);
  useEffect(() => {
    progressPositionRef.current = progress.position;
  }, [progress.position]);
  const [isLoading, setIsLoading] = useState(false);
  const lastPrefetchLengthRef = useRef<number | null>(null);
  const isPlayerSetupRef = useRef(false);
  const currentTrackIdRef = useRef<string | null>(null);
  const loadTokenRef = useRef(0);
  const postsRef = useRef(posts);
  const isActive = currentIndex === index;

  const { loadMoreArticles, hasMore, isFetching } = useArticlesStore();
  const { data } = useOnboarding();
  const insets = useSafeAreaInsets();

  const useUnifiedBottomInset = () => {
    const insets = useSafeAreaInsets();

    if (Platform.OS === "ios") {
      return insets.bottom;
    }

    // ⭐ Minimum bottom inset for all Android devices
    const ANDROID_MIN_INSET = 16; // consistent across all brands

    // ⭐ Final normalized bottom inset
    return Math.max(insets.bottom, ANDROID_MIN_INSET);
  };

  const bottomInset = useUnifiedBottomInset();
  const isTelugu = getLangCode() === "te";
  const langCode = isTelugu ? "te" : "en";
  const title = isTelugu ? article.title_te : article.title_en;
  const categoryName = isTelugu
    ? article.Category?.name_te || article.Category?.name_en
    : article.Category?.name_en;

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    if (!isActive) {
      setIsLoading(false);
    }
  }, [isActive]);

  // Determine if player is playing
  const isPlaying = playbackState.state === State.Playing || playbackState.state === State.Buffering;

  // Get audio URL based on language and voice preference
  const getAudioUrl = useCallback(() => {
    const audioFiles = article?.audio_files;
    if (!audioFiles) return null;

    const langAudio = audioFiles[langCode];
    if (!langAudio) return null;

    const voicePreference = data?.voice?.toLowerCase() || "female";
    const audioUrl = langAudio[voicePreference]?.Location || langAudio.female?.Location || langAudio.male?.Location;

    return audioUrl;
  }, [article, langCode, data?.voice]);

  // Setup TrackPlayer ONCE (global setup should already be done in index.js)
  useEffect(() => {
    if (!isActive) return;

    const setupPlayer = async () => {
      try {
        if (!isPlayerSetupRef.current) {
          const state = await TrackPlayer.getPlaybackState();

          if (!state) {
            await TrackPlayer.setupPlayer({
              maxCacheSize: 1024 * 10,
            });
          }

          await TrackPlayer.updateOptions({
            capabilities: [
              Capability.Play,
              Capability.Pause,
              Capability.SkipToNext,
              Capability.SkipToPrevious,
              Capability.SeekTo,
            ],
            compactCapabilities: [Capability.Play, Capability.Pause],
            notificationCapabilities: [Capability.Play, Capability.Pause],
          });

          isPlayerSetupRef.current = true;
          console.log("✅ TrackPlayer initialized");
        }
      } catch (error) {
        console.error("❌ Error setting up player:", error);
      }
    };

    setupPlayer();
  }, [isActive]);


  // Load and play audio when article changes
  useEffect(() => {
    if (!isActive) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const token = ++loadTokenRef.current;

    const loadAudio = async () => {
      try {
        const audioUrl = getAudioUrl();
        if (!audioUrl) {
          if (token === loadTokenRef.current) setIsLoading(false);
          console.log("⚠️ No audio URL");
          return;
        }

        const trackId = String(article.article_id);
        if (currentTrackIdRef.current === trackId) {
          if (token === loadTokenRef.current) setIsLoading(false);
          return;
        }

        currentTrackIdRef.current = trackId;
        if (!cancelled && token === loadTokenRef.current) {
          setIsLoading(true);
        }

        await TrackPlayer.stop();
        if (cancelled || token !== loadTokenRef.current) return;

        await TrackPlayer.reset();
        if (cancelled || token !== loadTokenRef.current) return;

        await TrackPlayer.add({
          id: trackId,
          url: audioUrl,
          title,
          artist: categoryName || "Neurom",
          artwork: article?.media?.thumbnail,
        });
        if (cancelled || token !== loadTokenRef.current) return;

        await TrackPlayer.play();
      } catch (err) {
        console.log("Audio load error:", err);
      } finally {
        if (!cancelled && token === loadTokenRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      cancelled = true;
    };
  }, [article.article_id, getAudioUrl, isActive, modeSwitchVersion, title, categoryName]);

  useEffect(() => {
    if (isActive) return;
    currentTrackIdRef.current = null;
    TrackPlayer.pause().catch(() => { });
  }, [isActive]);


  // Listen for track end event to auto-skip
  useEffect(() => {
    if (!isActive) return;

    const listener = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      console.log("🏁 Track ended, auto-skipping...");
      handleSkipForward();
    });

    return () => {
      listener.remove();
    };
  }, [isActive, handleSkipForward, modeSwitchVersion]);

  useEffect(() => {
    return () => {
      currentTrackIdRef.current = null;
      TrackPlayer.pause().catch(() => { });
      InteractionManager.runAfterInteractions(() => {
        TrackPlayer.stop().catch(() => { });
        TrackPlayer.reset().catch(() => { });
      });
    };
  }, []);

  const handlePlayPause = async () => {
    if (!isActive) return;

    try {
      if (isPlaying) {
        console.log("⏸️ Pausing...");
        await TrackPlayer.pause();
      } else {
        console.log("▶️ Playing...");
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error("❌ Error toggling playback:", error);
    }
  };

  const handleSkipForward = useCallback(async () => {
    if (!isActive) return;
    const list = postsRef.current;
    if (!Array.isArray(list)) return;
    const nextIndex = Math.min(currentIndex + 1, list.length - 1);
    if (nextIndex === currentIndex) return;
    console.log("⏭️ Skipping to next article");
    try {
      await TrackPlayer.pause();
    } catch { }
    onSelectArticle(list[nextIndex], nextIndex);
  }, [isActive, currentIndex, onSelectArticle]);

  const handleSkipBackward = useCallback(async () => {
    if (!isActive) return;
    const list = postsRef.current;
    if (!Array.isArray(list) || currentIndex <= 0) return;

    if (progressPositionRef.current > 3) {
      console.log("⏪ Restarting current track");
      try {
        await TrackPlayer.seekTo(0);
      } catch (error) {
        console.error("❌ Error seeking:", error);
      }
      return;
    }

    console.log("⏮️ Going to previous article");
    const prevIndex = currentIndex - 1;
    try {
      await TrackPlayer.pause();
    } catch { }
    onSelectArticle(list[prevIndex], prevIndex);
  }, [isActive, currentIndex, onSelectArticle]);

  const handleSeek = async (value: number) => {
    if (!isActive) return;

    try {
      await TrackPlayer.seekTo(value);
    } catch (error) {
      console.error("❌ Error seeking:", error);
    }
  };

  const handleShare = () => {
    try {
      shareToWhatsApp(title, article?.article_id);
    } catch (_) { }
  };

  const handleModeSwitch = useCallback(
    (target: boolean) => {
      if (target) {
        TrackPlayer.pause().catch(() => { });
      }
      onToggleMode(target);
    },
    [onToggleMode]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Prefetch next articles near end
  useEffect(() => {
    const nearEnd = index >= totalPosts - 2;
    if (!nearEnd || !hasMore || isFetching) return;
    if (lastPrefetchLengthRef.current === totalPosts) return;

    lastPrefetchLengthRef.current = totalPosts;
    loadMoreArticles(undefined, "state-articles");
  }, [index, totalPosts, hasMore, isFetching]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundColor,
          height: CONTENT_HEIGHT,
          marginTop: TOP_BAR_HEIGHT - insets.top,
        },
      ]}
    >


      {/* Top Overlay */}
      <View style={styles.topOverlay}>
        <TouchableOpacity onPress={onReport} activeOpacity={1} style={styles.tridotButton}>
          <Image
            source={require("../../../assets/icons/tridots.png")}
            style={styles.tridotIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Image / Thumbnail */}
      <View style={styles.imageContainer}>
        {article?.media?.type === "video" ? (
          <Image
            source={{ uri: article.media?.thumbnail }}
            style={styles.image}
            resizeMode="cover"
            resizeMethod="resize"
            fadeDuration={0}
          />
        ) : article?.media?.url ? (
          <Image
            source={{ uri: article.media.url }}
            style={styles.image}
            resizeMode="cover"
            resizeMethod="resize"
            fadeDuration={0}
          />
        ) : (
          <Image
            source={require("../../../assets/images/factory.png")}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.lavenderPurple} />
          </View>
        )}
      </View>

      {/* Overlay Actions */}
      <View style={styles.overlayActions}>
        <Button
          title={
            categoryName?.charAt(0)?.toUpperCase() +
            categoryName?.slice(1) || "General"
          }
          style={styles.chipButton}
          backgroundColor={colors.lavenderPurple}
          textStyle={styles.chipButtonText}
          onPress={() => {
            const cid = Number(
              (article?.category_id ?? article?.Category?.category_id) as number
            );
            if (!Number.isNaN(cid)) {
              onPressCategory?.(cid);
            }
          }}
        />
        <View style={styles.rightActions}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[styles.toggleButton, isTextMode && styles.toggleActive]}
              onPress={() => handleModeSwitch(true)}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: isTextMode ? "#fff" : "#000",
                    fontFamily: getFont("regular"),
                  },
                ]}
              >
                {t("text")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isTextMode && styles.toggleActive]}
              onPress={() => handleModeSwitch(false)}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: !isTextMode ? "#fff" : "#000",
                    fontFamily: getFont("regular"),
                  },
                ]}
              >
                {t("audio")}
              </Text>
            </TouchableOpacity>
          </View>
          <SaveButton
            articleId={article.article_id}
            deviceId={deviceId ?? ""}
            backgroundColor={colors.lavenderPurple}
          />
        </View>
      </View>

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { backgroundColor: colors.darkpurple }]}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.textcolor, fontFamily: getFont("bold") }]}>
          {title}
        </Text>

        {/* Audio Player Controls */}
        <View style={styles.controlsWrap}>
          {/* Progress Bar with Time */}
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.textcolor }]}>
              {formatTime(progress.position)}
            </Text>
            <Slider
              style={styles.progressBar}
              minimumValue={0}
              maximumValue={progress.duration || 90}
              value={progress.position}
              onSlidingComplete={handleSeek}
              minimumTrackTintColor={colors.lavenderPurple}
              maximumTrackTintColor={colors.mediumGray}
              thumbTintColor={colors.textcolor}
            />
            <Text style={[styles.timeText, { color: colors.textcolor }]}>
              {formatTime(progress.duration || 90)}
            </Text>
          </View>

          {/* Playback Controls */}
          <View style={styles.mainControls}>
            <TouchableOpacity
              style={[styles.controlButton, currentIndex <= 0 && styles.controlButtonDisabled]}
              onPress={handleSkipBackward}
              disabled={currentIndex <= 0 || isLoading}
            >
              <Ionicons
                name="play-skip-back"
                size={fw(30)}
                color={currentIndex <= 0 ? colors.mediumGray : colors.textcolor}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.textcolor} />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={fw(30)}
                  color={colors.textcolor}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                currentIndex >= posts.length - 1 && styles.controlButtonDisabled,
              ]}
              onPress={handleSkipForward}
              disabled={currentIndex >= posts.length - 1 || isLoading}
            >
              <Ionicons
                name="play-skip-forward"
                size={fw(30)}
                color={currentIndex >= posts.length - 1 ? colors.mediumGray : colors.textcolor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Interactions */}
        <InteractionsRow
          stats={stats}
          tintColor={colors.textcolor}
          backgroundColor="transparent"
          deviceId={deviceId ?? ""}
          contentType="articles"
          contentId={article.article_id}
          compact={true}
          onShare={handleShare}
          onComment={onComment}
          containerStyle={[styles.compactInteractionsContainer, { paddingBottom: bottomInset + fh(20) }]}
        />

        {/* Upcoming Section */}
        <View style={[styles.upcomingSection, { marginBottom: bottomInset + fh(40) }]}>
          <Text
            style={[
              styles.metaRights,
              { color: colors.textcolor, fontFamily: getFont("regular") },
            ]}
          >
            Coming up next
          </Text>

          <UpcomingArticlesCarousel
            articles={posts}
            currentIndex={currentIndex}
            isTelugu={isTelugu}
            onSelect={onSelectArticle}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: SCREEN_W,
    position: "relative",
    overflow: "hidden",
  },
  topOverlay: {
    position: "absolute",
    top: Platform.OS === "ios" ? ff(30) : ff(12),
    left: fw(16),
    right: fw(16),
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 5,
  },
  tridotButton: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: fw(6),
    borderRadius: fw(20),
    justifyContent: "center",
    alignItems: "center",
  },
  tridotIcon: {
    width: fw(14),
    height: fh(14),
    tintColor: "#fff",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1080 / 800,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayActions: {
    position: "relative",
    marginTop: fh(-BUTTON_HEIGHT * 1),
    marginHorizontal: fw(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  },
  chipButton: {
    paddingHorizontal: fw(12),
    height: BUTTON_HEIGHT,
    paddingVertical: fh(4),
    borderRadius: fw(20),
    alignSelf: "flex-start",
  },
  chipButtonText: {
    fontSize: ff(12),
    fontWeight: "500",
    color: "#fff",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: fw(8),
  },
  toggleWrapper: {
    flexDirection: "row",
    borderRadius: fw(20),
    overflow: "hidden",
    height: BUTTON_HEIGHT,
    backgroundColor: "#fff",
  },
  toggleButton: {
    paddingHorizontal: fw(12),
    paddingVertical: fh(4),
    justifyContent: "center",
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#997DDF",
    borderRadius: fw(20),
  },
  toggleText: {
    fontSize: ff(12),
    lineHeight: ff(18), // ⭐ ADD THIS → prevents clipping
    textAlignVertical: 'center',
    includeFontPadding: false, // (<– improves Android Telugu rendering)
  },
  bottomSection: {
    borderTopLeftRadius: fw(20),
    borderTopRightRadius: fw(20),
    overflow: "hidden",
    marginTop: fh(-BUTTON_HEIGHT * 0.95),
    paddingHorizontal: fw(16),
  },
  title: {
    fontSize: ff(18),
    fontWeight: "700",
    marginTop: fh(18),
    paddingVertical: fh(3),
    overflow: "hidden",
  },
  controlsWrap: {
    alignItems: "center",
    width: "100%",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  timeText: {
    fontSize: ff(11),
    fontWeight: "500",
    minWidth: fw(40),
    textAlign: "center",
  },
  progressBar: {
    flex: 1,
    marginHorizontal: fw(8),
    height: fh(20),
  },
  mainControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: fw(40),
    marginTop: fh(8),
  },
  controlButton: {
    padding: fw(8),
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  playButton: {
    padding: fw(8),
    justifyContent: "center",
    alignItems: "center",
  },
  compactInteractionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  upcomingSection: {
    // marginTop: fh(5),
  },
  metaRights: {
    fontSize: ff(12),
    fontWeight: "700",
    marginBottom: fh(2),
  },
});

const areAudioModePropsEqual = (
  prev: ArticleAudioModeProps,
  next: ArticleAudioModeProps
) => {
  return (
    prev.article === next.article &&
    prev.index === next.index &&
    prev.currentIndex === next.currentIndex &&
    prev.isTextMode === next.isTextMode &&
    prev.modeSwitchVersion === next.modeSwitchVersion &&
    prev.colors === next.colors &&
    prev.deviceId === next.deviceId &&
    prev.posts === next.posts &&
    prev.activeTab === next.activeTab
  );
};

export default React.memo(ArticleAudioMode, areAudioModePropsEqual);
