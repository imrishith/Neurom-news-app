// src/components/ShareModal.tsx
import React, { useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";
import Share from "react-native-share";
import { fw, fh, ff } from "../../utils/responsive";
import { useOnboarding } from "../context/OnboardingContext";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Ionicons from "react-native-vector-icons/Ionicons";
import ViewShot from "react-native-view-shot";
import RNFS from "react-native-fs";
import ShareCard from "./ShareCard";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  article?: any;
}

const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose, article }) => {
  const { getLangCode } = useOnboarding();
  const isTelugu = getLangCode() === "te";
  const cardRef = useRef<any>(null);
  const imageUrl =
    article?.media?.type === "video"
      ? article?.media?.thumbnail
      : article?.media?.url;

  // 🟢 4️⃣ Platform handlers
  const handleShare = async (platform: string) => {
    try {
      if (!article) return;
      console.log("🔵 Sharing to:",);
      // 🟢 1️⃣ Capture branded share card
      const captureUri = await cardRef.current.capture();
      const filePath = `${RNFS.CachesDirectoryPath}/Neurom_share_${Date.now()}.jpg`;
      await RNFS.copyFile(captureUri, filePath);
      // 🟢 2️⃣ Build message text

      const title = isTelugu
        ? article?.title_te || article?.title_en || "చూడండి!"
        : article?.title_en || article?.title_te || "Check this out!";

      const message = `${title}\n\n📲 ${isTelugu ? "షార్ట్‌లీ యాప్‌లో చదవండి:" : "Read on Neurom App:"
        }\nhttps://Neuromindia.com/article/${article.article_id}`;

      // 🟢 3️⃣ Common share options
      const shareOptions = {
        title: "Share via",
        message,
        url: `file://${filePath}`, // ✅ our generated image
      };

      // 🟢 4️⃣ Platform-specific sharing
      switch (platform) {
        case "whatsapp":
          await Share.shareSingle({
            ...shareOptions,
            social: Share.Social.WHATSAPP,
          });
          break;

        case "telegram":
          await Share.shareSingle({
            ...shareOptions,
            social: Share.Social.TELEGRAM,
          });
          break;

        case "facebook":
          await Share.shareSingle({
            ...shareOptions,
            social: Share.Social.FACEBOOK,
          });
          break;

        case "instagram":
          await Share.shareSingle({
            ...shareOptions,
            social: Share.Social.INSTAGRAM,
          });
          break;

        case "x":
          await Share.shareSingle({
            ...shareOptions,
            social: Share.Social.TWITTER,
          });
          break;

        case "copy":
          await Share.open({ message });
          break;

        case "more":
        default:
          await Share.open(shareOptions);
          break;
      }

      onClose();
    } catch (err) {
      console.log("❌ Share error:", err);
    }
  };


  // 🎨 Brand Colors
  const C = {
    whatsapp: "#25D366",
    telegram: "#0088cc",
    facebook: "#1877F2",
    instagram: "#E1306C",
    x: "#000000",
    Neurom: "#997DDF",
  };

  // 🟢 5️⃣ List of apps
  const shareItems = [
    { key: "whatsapp", label: "WhatsApp ", icon: <Ionicons name="logo-whatsapp" size={fw(32)} color={C.whatsapp} /> },
    { key: "telegram", label: "Telegram ", icon: <Ionicons name="navigate-sharp" size={fw(30)} color={C.telegram} /> },
    { key: "instagram", label: "Instagram ", icon: <Ionicons name="logo-instagram" size={fw(30)} color={C.instagram} /> },
    { key: "facebook", label: "Facebook ", icon: <Ionicons name="logo-facebook" size={fw(30)} color={C.facebook} /> },
    { key: "x", label: "X (Twitter) ", icon: <Ionicons name="logo-twitter" size={fw(30)} color={C.x} /> },
    { key: "copy", label: "Copy Link ", icon: <Ionicons name="copy-outline" size={fw(30)} color={C.Neurom} /> },
    { key: "more", label: "More ", icon: <Ionicons name="ellipsis-horizontal" size={fw(30)} color="#555" /> },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Share</Text>
          </View>

          {/* 🖼️ Preview image */}
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
          ) : null}

          {/* App buttons */}
          <FlatList
            data={shareItems}
            numColumns={4}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                activeOpacity={0.8}
                onPress={() => handleShare(item.key)}
              >
                <View style={styles.iconWrapper}>{item.icon}</View>
                <Text style={styles.label} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <View style={{ position: "absolute", opacity: 0 }} pointerEvents="none">
            <ViewShot
              ref={cardRef}
              options={{
                format: "jpg",
                quality: 1,
                width: 1080 * 2,
                height: 1800 * 2, // ✅ increased height
              }}
              style={{
                width: 1080,
                height: 1800,
                backgroundColor: "#fff",
              }}
            >
              <ShareCard article={article} />
            </ViewShot>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: fw(22),
    borderTopRightRadius: fw(22),
    paddingTop: fh(14),
    paddingBottom: fh(30),
    paddingHorizontal: fw(12),
  },
  headerRow: {
    alignItems: "center",
    marginBottom: fh(6),
  },
  headerText: {
    fontSize: ff(18),
    fontWeight: "700",
    color: "#000",
  },
  previewImage: {
    width: "95%",
    height: fh(160),
    alignSelf: "center",
    borderRadius: fw(12),
    marginVertical: fh(8),
  },
  item: {
    flex: 1 / 4,
    alignItems: "center",
    marginVertical: fh(10),
  },
  iconWrapper: {
    backgroundColor: "#F5F5F5",
    borderRadius: fw(40),
    padding: fw(12),
    marginBottom: fh(5),
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: ff(10),
    textAlign: "center",
    color: "#333",
  },
  cancelBtn: {
    marginTop: fh(10),
    paddingVertical: fh(12),
    borderRadius: fw(10),
    backgroundColor: "#EDEAF7",
  },
  cancelText: {
    fontSize: ff(14),
    fontWeight: "600",
    color: "#997DDF",
    textAlign: "center",
  },
});

export default ShareModal;
