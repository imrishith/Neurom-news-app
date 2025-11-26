// screens/Article/ArticleTextMode.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import ImageViewing from "react-native-image-viewing";
import FixedInteractionWrapper from "../../components/layout/FixedInteractionWrapper";
import Button from "../../components/Button";
import SaveButton from "../../components/SaveButton";
import InteractionsRow from "../../components/InteractionRow";
import { fw, fh, ff } from "../../../utils/responsive";
import { timeAgo } from "../../../utils/timeAgo";
import { shareToWhatsApp } from "../../../utils/shareUtils";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { transliterateText } from "../../../utils/transliteration";
import FastImage from "react-native-fast-image";
import { useFocusEffect } from '@react-navigation/native';
import CustomVideoPlayer from "./CustomVideoPlayer";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const BUTTON_HEIGHT = fh(28);

interface ArticleTextModeProps {
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
  stats: any;
  isVisible: boolean;
  CONTENT_HEIGHT: number;
  TOP_BAR_HEIGHT: number;
}

const ArticleTextMode: React.FC<ArticleTextModeProps> = ({
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
  stats,
  isVisible,
  CONTENT_HEIGHT,
  TOP_BAR_HEIGHT,
}) => {


  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const insets = useSafeAreaInsets();
  const REAL_BOTTOM_INSET = Platform.select({
    ios: insets.bottom,
    android: insets.bottom === 0 ? fh(-50) : insets.bottom,
  });
  const isTelugu = getLangCode() === "te";
  const title = isTelugu ? article.title_te : article.title_en;
  const description = isTelugu ? article.content_te : article.content_en;
  const imageSrc = article.media?.url;
  const categoryName = isTelugu
    ? article.Category?.name_te || article.Category?.name_en
    : article.Category?.name_en;

  let rawLocation = "";

  if (activeTab === "latest") {
    rawLocation = article.State?.name || "";
    // console.log('checking location State')
  } else if (activeTab === "state") {
    // console.log('checking location district')
    rawLocation = article.District?.name || article.State?.name || "";
  } else {
    rawLocation = article.District?.name || article.State?.name || "";
  }

  // 🟣 If Telugu, transliterate to Telugu script
  let locationName = rawLocation;


  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // milliseconds

    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      // ✅ Detected double-tap → open fullscreen
      if (imageSrc) setFullscreenImage(imageSrc);
    } else {
      setLastTap(now);
    }
  };



  useEffect(() => {
    if (!isVisible && isPlaying) {
      setIsPlaying(false);
    }

  }, [isVisible]);

  const getVideoUri = () => {
    return (
      article.media?.variants?.["720p"] ||
      article.media?.variants?.["1080p"]
    );
  };

  // Helper to get the poster source
  const getPosterUri = () => {
    return article.media?.thumbnail;
  }

  // ⭐ 1. HANDLER: Called by CustomVideoPlayer when the user initiates/pauses playback
  const handleVideoPlayToggle = useCallback((shouldPlay: boolean) => {
    setIsPlaying(shouldPlay);
  }, []);

  // ⭐ 2. HANDLER: Placeholder for full-screen action (requires native modules like react-native-orientation-locker)
  const handleFullscreenToggle = useCallback((isFullScreen: boolean) => {
    console.log(`Fullscreen toggled by player: ${isFullScreen ? 'ON' : 'OFF'}`);
    // In a production app, you would add logic here to lock/unlock screen orientation:
    // if (isFullScreen) {
    //   Orientation.lockToLandscape();
    // } else {
    //   Orientation.lockToPortrait();
    // }
  }, []);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: Colors.backgroundColor,
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

      {/* Image */}
      <View style={styles.imageContainer}>
        {article?.media?.type === "video" ? (
          <View style={styles.videoWrapper}>
            {/* 👇 Use CustomVideoPlayer component */}
            <CustomVideoPlayer
              videoUri={getVideoUri()}
              posterUri={getPosterUri()}
              style={styles.image}
              // If the row isn't visible, FORCE PAUSE. 
              // Even if isPlaying is true locally, !isVisible overrides it.
              paused={!isVisible || !isPlaying}
              onPlayToggle={handleVideoPlayToggle}
              onPlaybackEnd={() => setIsPlaying(false)}
              onFullscreenToggle={handleFullscreenToggle}
            />
          </View>
        ) : (
          // 🖼️ Fallback to image (KEEP THIS AS IT WAS)
          <View
            onStartShouldSetResponder={() => true} // ✅ capture touch here
            onResponderRelease={handleImagePress} // ✅ detect taps manually
          >

            <FastImage
              style={styles.image}
              source={{
                uri: imageSrc || "https://Neurom-bucket.s3.ap-south-1.amazonaws.com/processed/default.jpg",
                priority: FastImage.priority.high,
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

        )}
      </View>



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
              onPressCategory?.(cid);  // ✅ now calls parent function
            }
          }}
        />


        <View style={styles.rightActions}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[styles.toggleButton, isTextMode && styles.toggleActive]}
              onPress={() => onToggleMode(true)}
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
              onPress={() => onToggleMode(false)}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: !isTextMode ? "#fff" : "#000", fontFamily: getFont("regular") },
                ]}
              >
                {t('audio')}
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
        {/* Content (non-scrollable header + title, scrollable description) */}
        <View style={styles.contentWrap}>
          {/* Category + Toggle + Save */}

          {/* Title */}
          <Text style={[styles.title, { color: colors.textcolor, fontFamily: getFont("bold") }]}>
            {title}
          </Text>

          {/* Description (non-scrollable) */}
          <Text
            style={[
              styles.description,
              { color: colors.textcolor, fontFamily: getFont("regular") },
            ]}
          >
            {description}
          </Text>
        </View>

        {/* Footer with Meta and Interactions (always visible) */}
        <View>
          <View style={styles.footer}>
            {/* ✅ Meta info */}
            {totalPosts >= 1 && (
              <View style={[styles.metaRow, { bottom: (REAL_BOTTOM_INSET ?? 0) + fh(50) }]}>
                <Text style={[styles.paginationText, { color: colors.mediumGray, fontFamily: getFont("regular") }]}>
                  {index + 1}/{totalPosts} {t("pages")}
                </Text>
                <Text style={[styles.metaRight, { color: colors.mediumGray, fontFamily: getFont("regular") }]}>
                  {timeAgo(article.created_at)} | {locationName}
                </Text>
              </View>
            )}

            {/* ✅ InteractionsRow directly below meta */}
            <InteractionsRow
              stats={stats}
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
                { bottom: (REAL_BOTTOM_INSET ?? 0) + fh(50) } // 👈 PERFECT FIX
              ]}
            />
          </View>
        </View>

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
  articleId: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 0.4,
    borderColor: '#FFFFFF',
    fontSize: ff(10),
    fontWeight: '500',
    paddingHorizontal: fw(12),
    paddingVertical: fh(4),          // ✅ balanced vertical padding
    borderRadius: fh(12),            // ✅ matches vertical height for perfect oval
    lineHeight: ff(14),              // ✅ vertically centered text on iOS
    textAlign: 'center',
    alignSelf: 'center',
    minWidth: fw(70),
    overflow: 'visible',
  },


  tridotButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',  // same tint as articleId
    padding: fw(6),                         // inner spacing around icon
    borderRadius: fw(20),                   // makes it perfectly round
    justifyContent: 'center',
    alignItems: 'center',
  },
  tridotIcon: {
    width: fw(14),
    height: fh(14),
    tintColor: "#fff",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1080 / 800,
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",      // ✅ Perfectly fills the space, no black edges
  },


  bottomSection: {
    flex: 1,
    borderTopLeftRadius: fw(20),
    borderTopRightRadius: fw(20),
    overflow: "visible",  // ✅ prevents clipping of Telugu top/bottom glyphs
    justifyContent: "space-between",
    marginTop: fh(-BUTTON_HEIGHT * 0.95),
  },

  contentWrap: {
    flex: 1,
    paddingHorizontal: fw(16),
    paddingTop: fh(6),
    paddingBottom: fh(10),
    overflow: "visible",   // ✅ allows CoreText to render full ascenders/descenders
  },
  descriptionScroll: {
    flex: 1,
    minHeight: 0,
  },
  descriptionScrollContent: {
    paddingBottom: fh(4),
  },
  dividerRow: {
    position: "absolute",
    top: SCREEN_H * 0.001, // place just below image
    left: fw(16),
    right: fw(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 9000,
  },

  chipButton: {
    paddingHorizontal: fw(12),
    height: BUTTON_HEIGHT,
    paddingVertical: fh(4),
    borderRadius: fw(20),
    alignSelf: 'flex-start',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: "#997DDF",
    borderRadius: fw(20),
  },
  toggleText: {
    fontSize: ff(12),
    lineHeight: ff(20), // ⭐ ADD THIS → prevents clipping
    textAlignVertical: 'center',
    includeFontPadding: false, // (<– improves Android Telugu rendering)
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
    lineHeight: ff(22),            // ✅ matches iOS native line height
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

  overlayActions: {
    position: "relative",
    marginTop: fh(-BUTTON_HEIGHT * 1), // adjust a bit upward if needed
    marginHorizontal: fw(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  },

  videoWrapper: {
    width: "100%",
    aspectRatio: 1080 / 800,
    position: "relative",
    backgroundColor: "#000",
  },

  thumbnailWrapper: {
    position: "relative",
  },

  playButtonOverlay: {
    position: "absolute",
    top: "40%",
    left: "42%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    opacity: 0.9,
  },




});

export default React.memo(ArticleTextMode);