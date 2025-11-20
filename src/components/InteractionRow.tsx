// components/InteractionsRow.tsx
import React, { useEffect, useRef, useState, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import { fw, ff, fh } from "../../utils/responsive";
import { interactionService } from "../api/content/interactionService";
import { useTheme } from "../context/ThemeContext";

interface InteractionsRowProps {
  stats?: {
    likes_count?: string | number;
    dislikes_count?: string | number;
    comments_count?: string | number;
    shares_count?: string | number;
  };
  tintColor?: string;
  backgroundColor?: string;
  compact?: boolean;
  onComment?: () => void;
  onShare?: () => void;
  // ✨ ADDED: Prop to expose the internal like action function
  onProvideLikeAction?: (likeFn: () => void) => void;
  containerStyle?: ViewStyle;
  iconSize?: number;
  contentType: "articles" | "videos" | "magazines" | "buzz";
  isActive?: boolean;
  contentId: number | string;
  deviceId: string;
  ViewableItem?: string | number;
}

const InteractionsRow: React.FC<InteractionsRowProps> = ({
  stats,
  tintColor = "#fff",
  backgroundColor = "transparent",
  compact = false,
  onComment,
  onShare,
  // ✨ ADDED
  onProvideLikeAction,
  containerStyle,
  contentType,
  contentId,
  deviceId,
  ViewableItem,
  isActive = true,
  iconSize = fw(24),
}) => {
  // ✅ Counts
  const [likes, setLikes] = useState(parseInt(stats?.likes_count as any, 10) || 0);
  const [dislikes, setDislikes] = useState(parseInt(stats?.dislikes_count as any, 10) || 0);
  const [shares, setShares] = useState(parseInt(stats?.shares_count as any, 10) || 0);
  const [comments] = useState(parseInt(stats?.comments_count as any, 10) || 0);
  const { Colors } = useTheme();

  // ✅ User states
  const [userLiked, setUserLiked] = useState(false);
  const [userUnliked, setUserUnliked] = useState(false);

  const fetchedRef = useRef<Set<string>>(new Set());

  // ✅ Fetch current user interaction
  useEffect(() => {
    if (!deviceId || !contentId) return;
    if (contentType === "videos" && !isActive) return;

    const cid = String(contentId);
    if (fetchedRef.current.has(cid)) return; // already fetched once
    fetchedRef.current.add(cid);

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await interactionService.getUserInteraction(
          contentType,
          cid,
          deviceId,
          { signal: controller.signal }
        );
        if (!cancelled) {
          setUserLiked(res.like);
          setUserUnliked(res.unlike);
        }
      } catch (err) {
        if (!cancelled) console.error("❌ Fetch user interaction failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort?.();
    };
  }, [contentType, contentId, deviceId, isActive]);

  // ✨ ADDED: Expose the like action function to the parent (ReelCard)
  useEffect(() => {
    if (onProvideLikeAction) {
      const likeAction = () => handleInteraction("like");
      onProvideLikeAction(likeAction);
    }
  }, [onProvideLikeAction]);


  // ✅ Handle like/unlike/share
  const handleInteraction = async (type: "like" | "unlike" | "share") => {
    try {
      if (type === "like") {
        if (userLiked) {
          setLikes((prev) => Math.max(prev - 1, 0));
          setUserLiked(false);
        } else {
          setLikes((prev) => prev + 1);
          if (userUnliked) {
            setDislikes((prev) => Math.max(prev - 1, 0));
            setUserUnliked(false);
          }
          setUserLiked(true);
        }
      }

      if (type === "unlike") {
        if (userUnliked) {
          setDislikes((prev) => Math.max(prev - 1, 0));
          setUserUnliked(false);
        } else {
          setDislikes((prev) => prev + 1);
          if (userLiked) {
            setLikes((prev) => Math.max(prev - 1, 0));
            setUserLiked(false);
          }
          setUserUnliked(true);
        }
      }

      if (type === "share") {
        setShares((prev) => prev + 1);
      }

      await interactionService.addInteraction(contentType, contentId, deviceId, type);
    } catch (err) {
      console.error("❌ Interaction failed:", err);
    }
  };

  // ✅ Reusable button
  const renderButton = (
    icon: JSX.Element,
    count: number,
    onPress?: () => void,
    extraStyle?: any
  ) => (
    <TouchableOpacity
      style={[styles.button, contentType === "videos" && styles.videoButton]}
      onPress={onPress}
    >
      {icon}
      <Text
        style={[
          styles.count,
          contentType === "videos" && styles.videoCount,
          extraStyle,
          { color: tintColor },
        ]}
      >
        {count}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
    style={[
      styles.row,
      {
        backgroundColor: compact ? "transparent" : backgroundColor,
        flexDirection: contentType === "videos" ? "column" : "row",
      },
      containerStyle,
    ]}
  >
    {/* 👍 Like */}
    {renderButton(
      contentType === "videos" ? (
        <AntDesign
          name={userLiked ? "heart" : "hearto"}
          size={iconSize}
          color={userLiked ? "red" : tintColor}
        />
      ) : (
        <AntDesign
          name={userLiked ? "like1" : "like2"}
          size={iconSize}
          color={userLiked ? Colors.circle : tintColor}
        />
      ),
      likes,
      () => handleInteraction("like")
    )}

    {/* 👎 Unlike → now also for buzz & magazines */}
    {(contentType === "articles" ||
      contentType === "buzz" ||
      contentType === "magazines") &&
      renderButton(
        <AntDesign
          name={userUnliked ? "dislike1" : "dislike2"}
          size={iconSize}
          color={userUnliked ? Colors.circle : tintColor}
        />,
        dislikes,
        () => handleInteraction("unlike")
      )}

    {/* 💬 Comment (common for all) */}
    {renderButton(
      <Ionicons name="chatbubble-outline" size={iconSize} color={tintColor} />,
      comments,
      onComment
    )}

    {/* 🔗 Share (common for all) */}
    {renderButton(
      contentType === "videos" ? (
        <Ionicons name="paper-plane-outline" size={iconSize} color={tintColor} />
      ) : (
        // <Image
        //   source={require("../../assets/icons/Share.png")}
        //   style={{
        //     width: fw(20),
        //     height: fw(20),
        //     tintColor: tintColor,
        //     resizeMode: "contain",
        //   }}
        // />
        <Ionicons name="share-social-outline" size={iconSize} color={tintColor} />
      ),
      shares,
      () => {
        handleInteraction("share");
        if (onShare) onShare();
      }
    )}
  </View>
  );
};

export default memo(InteractionsRow);

const styles = StyleSheet.create({
  // ... (styles remain unchanged)
  row: {
    borderRadius: fw(25),
    paddingVertical: fh(8),
    paddingHorizontal: fw(12),
    alignItems: "center",
    justifyContent: "space-around",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: fw(8),
    marginVertical: fh(6),
  },
  count: {
    fontSize: ff(12),
    marginLeft: fw(6),
    fontWeight: "500",
  },
  videoButton: {
    flexDirection: "column",
    marginHorizontal: 0,
    marginVertical: fh(10),
  },
  videoCount: {
    marginLeft: 0,
    marginTop: fh(4),
  },
  buzzCount: {
    fontSize: ff(14), // bigger count for buzz share
    fontWeight: "600",
  },
});