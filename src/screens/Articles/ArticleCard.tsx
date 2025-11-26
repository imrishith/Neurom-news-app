// screens/Articles/ArticleCard.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import ImageViewing from "react-native-image-viewing";
import FastImage from "react-native-fast-image";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../../components/Button";
import SaveButton from "../../components/SaveButton";
import InteractionsRow from "../../components/InteractionRow";
import CustomVideoPlayer from "./CustomVideoPlayer";
import UpcomingArticlesCarousel from "../AudioScreen/UpcomingArticlesCarousel";

import { fw, fh, ff } from "../../../utils/responsive";
import { timeAgo } from "../../../utils/timeAgo";
import { shareToWhatsApp } from "../../../utils/shareUtils";
import { useArticlesStore } from "../../../utils/store/useArticlesStore";
import { useOnboarding } from "../../context/OnboardingContext";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const BUTTON_HEIGHT = fh(28);

interface ArticleCardProps {
    article: any;
    index: number;
    currentIndex: number;
    colors: any;
    t: (key: string) => string;
    getFont: (weight?: "bold" | "medium" | "regular" | "semibold") => string;
    getLangCode: () => string;
    deviceId?: string;
    totalPosts: number;
    activeTab: string;
    posts?: any[];
    onPressCategory?: (id: number) => void;
    onShare: () => void;
    onComment: () => void;
    onReport: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
    article,
    index,
    currentIndex,
    colors,
    t,
    getFont,
    getLangCode,
    deviceId,
    totalPosts,
    activeTab,
    posts = [],
    onPressCategory,
    onShare,
    onComment,
    onReport,
}) => {
    // ============================================================
    // STATE MANAGEMENT
    // ============================================================
    const [isTextMode, setIsTextMode] = useState(true);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [lastTap, setLastTap] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const insets = useSafeAreaInsets();
    const playbackState = usePlaybackState();
    const progress = useProgress();
    const { data } = useOnboarding();
    const { loadMoreArticles, hasMore, isFetching } = useArticlesStore();

    // Refs
    const progressPositionRef = useRef(progress.position);
    const isPlayerSetupRef = useRef(false);
    const currentTrackIdRef = useRef<string | null>(null);
    const loadTokenRef = useRef(0);
    const postsRef = useRef(posts);
    const lastPrefetchLengthRef = useRef<number | null>(null);

    // ============================================================
    // COMPUTED VALUES (ONCE)
    // ============================================================
    const isVisible = index === currentIndex;
    const isTelugu = getLangCode() === "te";
    const langCode = isTelugu ? "te" : "en";

    const title = isTelugu ? article.title_te : article.title_en;
    const description = isTelugu ? article.content_te : article.content_en;
    const imageSrc = article.media?.url;
    const categoryName = isTelugu
        ? article.Category?.name_te || article.Category?.name_en
        : article.Category?.name_en;

    let locationName = "";
    if (activeTab === "latest") {
        locationName = article.State?.name || "";
    } else {
        locationName = article.District?.name || article.State?.name || "";
    }

    // ============================================================
    // REFS UPDATE
    // ============================================================
    useEffect(() => {
        progressPositionRef.current = progress.position;
    }, [progress.position]);

    useEffect(() => {
        postsRef.current = posts;
    }, [posts]);

    // ============================================================
    // TEXT MODE HANDLERS
    // ============================================================
    const handleImagePress = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
            if (imageSrc) setFullscreenImage(imageSrc);
        } else {
            setLastTap(now);
        }
    };

    const handleVideoPlayToggle = useCallback((shouldPlay: boolean) => {
        setIsPlaying(shouldPlay);
    }, []);

    const handleFullscreenToggle = useCallback((isFullScreen: boolean) => {
        console.log(`Fullscreen: ${isFullScreen ? "ON" : "OFF"}`);
    }, []);

    // ============================================================
    // AUDIO MODE SETUP
    // ============================================================
    const isAudioPlaying = playbackState.state === State.Playing || playbackState.state === State.Buffering;

    const getAudioUrl = useCallback(() => {
        const audioFiles = article?.audio_files;
        if (!audioFiles) return null;
        const langAudio = audioFiles[langCode];
        if (!langAudio) return null;
        const voicePreference = data?.voice?.toLowerCase() || "female";
        return langAudio[voicePreference]?.Location || langAudio.female?.Location || langAudio.male?.Location;
    }, [article, langCode, data?.voice]);

    // Setup TrackPlayer
    useEffect(() => {
        if (!isVisible || isTextMode) return;

        const setupPlayer = async () => {
            try {
                if (!isPlayerSetupRef.current) {
                    const state = await TrackPlayer.getPlaybackState();
                    if (!state) {
                        await TrackPlayer.setupPlayer({ maxCacheSize: 1024 * 10 });
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
                }
            } catch (error) {
                console.error("TrackPlayer setup error:", error);
            }
        };

        setupPlayer();
    }, [isVisible, isTextMode]);

    // Load and play audio
    useEffect(() => {
        if (!isVisible || isTextMode) {
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
    }, [article.article_id, getAudioUrl, isVisible, isTextMode, title, categoryName]);

    // Pause when not active
    useEffect(() => {
        if (isVisible && !isTextMode) return;
        currentTrackIdRef.current = null;
        TrackPlayer.pause().catch(() => { });
    }, [isVisible, isTextMode]);

    // Cleanup
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

    // ============================================================
    // AUDIO CONTROLS
    // ============================================================
    const handlePlayPause = async () => {
        if (!isVisible || isTextMode) return;
        try {
            if (isAudioPlaying) {
                await TrackPlayer.pause();
            } else {
                await TrackPlayer.play();
            }
        } catch (error) {
            console.error("Playback error:", error);
        }
    };

    const handleSeek = async (value: number) => {
        if (!isVisible || isTextMode) return;
        try {
            await TrackPlayer.seekTo(value);
        } catch (error) {
            console.error("Seek error:", error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // ============================================================
    // MODE TOGGLE
    // ============================================================
    const handleModeToggle = useCallback((mode: boolean) => {
        if (!mode) {
            // Switching to audio - pause video
            setIsPlaying(false);
        } else {
            // Switching to text - pause audio
            TrackPlayer.pause().catch(() => { });
        }
        setIsTextMode(mode);
    }, []);

    // ============================================================
    // PREFETCH
    // ============================================================
    useEffect(() => {
        if (isTextMode) return;
        const nearEnd = index >= totalPosts - 2;
        if (!nearEnd || !hasMore || isFetching) return;
        if (lastPrefetchLengthRef.current === totalPosts) return;
        lastPrefetchLengthRef.current = totalPosts;
        loadMoreArticles(undefined, "state-articles");
    }, [index, totalPosts, hasMore, isFetching, isTextMode]);

    // ============================================================
    // RENDER
    // ============================================================
    const getVideoUri = () => {
        return article.media?.variants?.["720p"] || article.media?.variants?.["1080p"];
    };

    const getPosterUri = () => {
        return article.media?.thumbnail;
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundColor }]}>
            {/* Top Overlay */}
            <View style={styles.topOverlay}>
                <TouchableOpacity onPress={onReport} activeOpacity={1} style={styles.tridotButton}>
                    <Image
                        source={require("../../../assets/icons/tridots.png")}
                        style={styles.tridotIcon}
                    />
                </TouchableOpacity>
            </View>

            {/* Image/Video */}
            <View style={styles.imageContainer}>
                {article?.media?.type === "video" ? (
                    isTextMode ? (
                        <View style={styles.videoWrapper}>
                            <CustomVideoPlayer
                                videoUri={getVideoUri()}
                                posterUri={getPosterUri()}
                                style={styles.image}
                                paused={!isVisible || !isPlaying}
                                onPlayToggle={handleVideoPlayToggle}
                                onPlaybackEnd={() => setIsPlaying(false)}
                                onFullscreenToggle={handleFullscreenToggle}
                            />
                        </View>
                    ) : (
                        <Image
                            source={{ uri: article.media?.thumbnail }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    )
                ) : imageSrc ? (
                    <TouchableOpacity
                        onStartShouldSetResponder={() => true}
                        onResponderRelease={handleImagePress}
                    >
                        <FastImage
                            style={styles.image}
                            source={{
                                uri: imageSrc || "https://Neurom-bucket.s3.ap-south-1.amazonaws.com/processed/default.jpg",
                                priority: FastImage.priority.high,
                            }}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    </TouchableOpacity>
                ) : (
                    <Image
                        source={require("../../../assets/images/factory.png")}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}

                {/* Loading Overlay for Audio */}
                {!isTextMode && isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors.lavenderPurple} />
                    </View>
                )}
            </View>

            {/* Overlay Actions */}
            <View style={styles.overlayActions}>
                <Button
                    title={categoryName?.charAt(0)?.toUpperCase() + categoryName?.slice(1) || "General"}
                    style={styles.chipButton}
                    backgroundColor={colors.lavenderPurple}
                    textStyle={styles.chipButtonText}
                    onPress={() => {
                        const cid = Number(article?.category_id ?? article?.Category?.category_id);
                        if (!Number.isNaN(cid)) {
                            onPressCategory?.(cid);
                        }
                    }}
                />
                <View style={styles.rightActions}>
                    <View style={styles.toggleWrapper}>
                        <TouchableOpacity
                            style={[styles.toggleButton, isTextMode && styles.toggleActive]}
                            onPress={() => handleModeToggle(true)}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    { color: isTextMode ? "#fff" : "#000", fontFamily: getFont("regular") },
                                ]}
                            >
                                {t("text")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, !isTextMode && styles.toggleActive]}
                            onPress={() => handleModeToggle(false)}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    { color: !isTextMode ? "#fff" : "#000", fontFamily: getFont("regular") },
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
                {isTextMode ? (
                    // TEXT MODE CONTENT
                    <>
                        <View style={styles.contentWrap}>
                            <Text style={[styles.title, { color: colors.textcolor, fontFamily: getFont("bold") }]}>
                                {title}
                            </Text>
                            <Text
                                style={[
                                    styles.description,
                                    { color: colors.textcolor, fontFamily: getFont("regular") },
                                ]}
                            >
                                {description}
                            </Text>
                        </View>

                        <View>
                            <View style={styles.footer}>
                                {totalPosts >= 1 && (
                                    <View style={styles.metaRow}>
                                        <Text
                                            style={[
                                                styles.paginationText,
                                                { color: colors.mediumGray, fontFamily: getFont("regular") },
                                            ]}
                                        >
                                            {index + 1}/{totalPosts} {t("pages")}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.metaRight,
                                                { color: colors.mediumGray, fontFamily: getFont("regular") },
                                            ]}
                                        >
                                            {timeAgo(article.created_at ?? "")} | {locationName}
                                        </Text>
                                    </View>
                                )}

                                <InteractionsRow
                                    stats={article.stats || { views_count: 0, likes_count: 0, shares_count: 0, comments_count: 0 }}
                                    tintColor={colors.textcolor}
                                    backgroundColor="#49425B33"
                                    deviceId={deviceId ?? ""}
                                    contentType="articles"
                                    contentId={article.article_id}
                                    compact={false}
                                    onShare={onShare}
                                    onComment={onComment}
                                    containerStyle={[
                                        styles.interactionsContainer,
                                        { marginBottom: insets.bottom + fh(1) },
                                    ]}
                                />
                            </View>
                        </View>
                    </>
                ) : (
                    // AUDIO MODE CONTENT
                    <>
                        <View style={styles.content}>
                            <Text style={[styles.title, { color: colors.textcolor, fontFamily: getFont("bold") }]}>
                                {title}
                            </Text>

                            {/* Audio Controls */}
                            <View style={styles.controlsWrap}>
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

                                <View style={styles.mainControls}>
                                    <TouchableOpacity
                                        style={[styles.controlButton, index <= 0 && styles.controlButtonDisabled]}
                                        disabled={index <= 0 || isLoading}
                                    >
                                        <Ionicons
                                            name="play-skip-back"
                                            size={fw(30)}
                                            color={index <= 0 ? colors.mediumGray : colors.textcolor}
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
                                                name={isAudioPlaying ? "pause" : "play"}
                                                size={fw(30)}
                                                color={colors.textcolor}
                                            />
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.controlButton,
                                            index >= posts.length - 1 && styles.controlButtonDisabled,
                                        ]}
                                        disabled={index >= posts.length - 1 || isLoading}
                                    >
                                        <Ionicons
                                            name="play-skip-forward"
                                            size={fw(30)}
                                            color={index >= posts.length - 1 ? colors.mediumGray : colors.textcolor}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <InteractionsRow
                                stats={article.stats || { views_count: 0, likes_count: 0, shares_count: 0, comments_count: 0 }}
                                tintColor={colors.textcolor}
                                backgroundColor="transparent"
                                deviceId={deviceId ?? ""}
                                contentType="articles"
                                contentId={article.article_id}
                                compact={true}
                                onShare={() => shareToWhatsApp(title, article.article_id)}
                                onComment={onComment}
                                containerStyle={styles.compactInteractionsContainer}
                            />
                        </View>

                        <View style={styles.upcomingSection}>
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
                                onSelect={() => { }}
                            />
                        </View>
                    </>
                )}
            </View>

            {/* Fullscreen Image Viewer */}
            {fullscreenImage && (
                <ImageViewing
                    images={[{ uri: fullscreenImage }]}
                    imageIndex={0}
                    visible={true}
                    onRequestClose={() => setFullscreenImage(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        width: SCREEN_W,
        alignSelf: "center",
        overflow: "hidden",
        marginVertical: fh(8),
        backgroundColor: "#000",
    },
    topOverlay: {
        position: "absolute",
        top: fh(12),
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
    videoWrapper: {
        width: "100%",
        aspectRatio: 1080 / 800,
        position: "relative",
        backgroundColor: "#000",
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
        textAlignVertical: "center",
    },
    bottomSection: {
        flex: 1,
        borderTopLeftRadius: fw(20),
        borderTopRightRadius: fw(20),
        overflow: "visible",
        justifyContent: "space-between",
        marginTop: fh(-BUTTON_HEIGHT * 0.95),
    },
    contentWrap: {
        flex: 1,
        paddingHorizontal: fw(16),
        paddingTop: fh(6),
        paddingBottom: fh(10),
        overflow: "visible",
    },
    content: {
        flex: 1,
        paddingHorizontal: fw(16),
        paddingTop: fh(6),
        paddingBottom: fh(5),
        minHeight: 0,
        alignSelf: "stretch",
        width: "100%",
    },
    title: {
        fontSize: ff(18),
        fontWeight: "700",
        marginTop: fh(18),
        paddingVertical: fh(3),
        overflow: "hidden",
    },
    description: {
        fontSize: ff(16),
        letterSpacing: 0.3,
        lineHeight: ff(22),
        overflow: "hidden",
    },
    footer: {
        paddingHorizontal: fw(16),
        paddingTop: fh(8),
        justifyContent: "flex-end",
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: fh(8),
    },
    interactionsContainer: {
        alignSelf: "center",
        width: fw(277),
        paddingHorizontal: fw(10),
    },
    paginationText: {
        fontSize: ff(12),
        fontWeight: "500",
    },
    metaRight: {
        fontSize: ff(12),
        fontWeight: "500",
    },
    controlsWrap: {
        alignItems: "center",
        width: "100%",
        marginBottom: fh(-10),
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        marginTop: fh(-10),
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
        height: fh(40),
    },
    mainControls: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        gap: fw(40),
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
        paddingTop: fh(10),
    },
    metaRights: {
        fontSize: ff(12),
        fontWeight: "700",
        left: fw(20),
        marginBottom: fh(-5),
    },
});

// Performance optimization
const arePropsEqual = (prev: ArticleCardProps, next: ArticleCardProps) => {
    return (
        prev.article.article_id === next.article.article_id &&
        prev.index === next.index &&
        prev.currentIndex === next.currentIndex &&
        prev.colors === next.colors &&
        prev.totalPosts === next.totalPosts
    );
};

export default React.memo(ArticleCard, arePropsEqual);
