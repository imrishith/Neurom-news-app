// src/components/share/article/ArticleShareModal.tsx
import React, { useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  Platform,
  Animated,
  Easing
} from "react-native";
import Share from "react-native-share";
import ViewShot from "react-native-view-shot";
import RNFS from "react-native-fs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { fw, fh, ff } from "../../../../utils/responsive";
import { useOnboarding } from "../../../context/OnboardingContext";
import ArticleShareCard from "./ArticleShareCard"; // ✅ your card component
interface ArticleShareModalProps {
  visible: boolean;
  onClose: () => void;
  article?: any;
}




const ArticleShareModal: React.FC<ArticleShareModalProps> = ({
  visible,
  onClose,
  article,
}) => {
  const {t, getLangCode } = useOnboarding();
  const isTelugu = getLangCode() === "te";
  const cardRef = useRef<any>(null);

  const imageUrl =
    article?.media?.type === "video"
      ? article?.media?.thumbnail
      : article?.media?.url;

  /** 🟣 Capture + Share Handler */
  const handleShare = async (platform: string) => {
    try {
      if (!article) return;

      // 1️⃣ Capture share card
      const captureUri = await cardRef.current.capture();
      const filePath = `${RNFS.CachesDirectoryPath}/article_share_${Date.now()}.jpg`;
      await RNFS.copyFile(captureUri, filePath);

      // 2️⃣ Prepare message
      const title = isTelugu
        ? article?.title_te || article?.title_en || "చూడండి!"
        : article?.title_en || article?.title_te || "Check this out!";

      const message = `${title}\n\n📲 ${isTelugu ? "షార్ట్‌లీ యాప్‌లో చదవండి:" : "Read on Neurom App:"
        }\nhttps://play.google.com/store/apps/details?id=com.Neurom`;

      const shareOptions = {
        title: "Share via",
        message,
        url: `file://${filePath}`,
      };

      const trySharePlatform = async (social: string, appName: string, packageName: string) => {
        try {
          if (Platform.OS === "android") {
            let isInstalled = false;
            try {
              const result = await Share.isPackageInstalled(packageName);
              isInstalled = result?.isInstalled;
            } catch {
              isInstalled = false;
            }

            if (!isInstalled) {
              Alert.alert(
                `${appName} not installed`,
                `Please install ${appName} on your device to share.`
              );
              return;
            }
          }

          await Share.shareSingle({ ...shareOptions, social });
        } catch (err) {
          console.warn(`⚠️ ${appName} share failed:`, err);
          Alert.alert(
            `Unable to share via ${appName}`,
            "Either the app is not installed or sharing is not supported."
          );
        }
      };



      // 3️⃣ Share to selected platform
      switch (platform) {
        case "whatsapp":
          await trySharePlatform(Share.Social.WHATSAPP, "WhatsApp", "com.whatsapp");
          break;

        case "telegram":
          await trySharePlatform(Share.Social.TELEGRAM, "Telegram", "org.telegram.messenger");
          break;

        case "facebook":
          await trySharePlatform(Share.Social.FACEBOOK, "Facebook", "com.facebook.katana");
          break;

        case "instagram":
          try {
            const fileUri = `file://${filePath}`;

            if (Platform.OS === "android") {
              await Share.shareSingle({
                url: fileUri,
                social: Share.Social.INSTAGRAM,
                type: "image/jpeg",
              });
            } else {
              // iOS requires "instagram-stories" scheme
              await Share.shareSingle({
                method: Share.InstagramStories.SHARE_BACKGROUND_IMAGE,
                backgroundImage: fileUri,
                social: Share.Social.INSTAGRAM,
              });
            }
          } catch (err) {
            console.warn("⚠️ Instagram share failed:", err);
            Alert.alert(
              "Instagram not available",
              "Please ensure Instagram is installed and up to date."
            );
          }
          break;


        case "x":
          await trySharePlatform(Share.Social.TWITTER, "X (Twitter)", "com.twitter.android");
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
      console.log("❌ Article share error:", err);
    }
  };

  /** 🎨 Brand palette */
  const C = {
    whatsapp: "#25D366",
    instagram: "#F8F8F8",
    facebook: "#3B5998",
    x: "#FFFFFF",
    Neurom: "#997DDF",
  };

  /** 📱 App share list */
  const shareItems = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      iconName: "logo-whatsapp",
      iconColor: "#fff",
      bgColor: C.whatsapp,
    },
    {
      key: "instagram",
      label: "Instagram",
      iconName: "logo-instagram",
      iconColor: "#ee2a7b",
      bgColor: C.instagram,
    },
    {
      key: "facebook",
      label: "Facebook",
      iconName: "logo-facebook",
      iconColor: "#fff",
      bgColor: C.facebook,
    },
    {
      key: "x",
      label: "X (Twitter)",
      iconName: "logo-twitter",
      iconColor: "#1DA1F2",
      bgColor: C.x,
    },
    {
      key: "copy",
      label: "Copy Link",
      iconName: "copy-outline",
      iconColor: "#fff",
      bgColor: C.Neurom,
    },
    {
      key: "more",
      label: "More",
      iconName: "ellipsis-horizontal",
      iconColor: "#fff",
      bgColor: "#555",
    },
  ];

  const slideAnim = useRef(new Animated.Value(fh(300))).current;  // start bottom
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
  if (visible) {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,                    // smooth duration
        easing: Easing.out(Easing.cubic), // smooth easing curve
        useNativeDriver: true,
      }),
    ]).start();
  } else {
    slideAnim.setValue(fh(300));
  }
}, [visible]);




  return (
    <Modal visible={visible} transparent animationType="slide" >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.overlay}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <Text style={styles.headerText}>{t('share')}</Text>
          </View>

          <FlatList
            data={shareItems}
            numColumns={3}     // ← 3 per row
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                activeOpacity={0.8}
                onPress={() => handleShare(item.key)}
              >
                <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.iconName} size={fw(20)} color={item.iconColor} />
                </View>
                <Text style={styles.label}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />

          {/* ViewShot ... */}
        </Animated.View>
      </TouchableOpacity>

    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1F1A2B",
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
    color: "#E0E0E0",
  },
  previewImage: {
    width: "95%",
    height: fh(160),
    alignSelf: "center",
    borderRadius: fw(12),
    marginVertical: fh(8),
  },
  item: {
    width: '33.33%',  // or fw(80) for fixed width
    alignItems: "center",
    marginVertical: fh(10),
  },
  iconWrapper: {
    borderRadius: fw(40),
    padding: fw(12),
    marginBottom: fh(5),
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: ff(10),
    textAlign: "center",
    color: "#FFFFFF",
    paddingHorizontal: fw(2), // Add small horizontal padding
    width: '100%', // Ensure text uses full available width
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
  handleBar: {
    width: fw(40),
    height: fh(4),
    backgroundColor: "#777",
    borderRadius: fw(10),
    alignSelf: "center",
    marginBottom: fh(10),
    opacity: 0.7,
  },

});

export default ArticleShareModal;
