import React, { useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Platform,
  Alert,
  Animated,
  Easing
} from "react-native";
import Share from "react-native-share";
import ViewShot from "react-native-view-shot";
import RNFS from "react-native-fs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { fw, fh, ff } from "../../../../utils/responsive";
import { useOnboarding } from "../../../context/OnboardingContext";
import ReelShareCard from "./ReelShareCard";

const ReelsShareModal = ({ visible, onClose, reel }: any) => {
  const { t, getLangCode } = useOnboarding();
  const isTelugu = getLangCode() === "te";
  const cardRef = useRef<any>(null);

  /** 🟣 Capture + Share Handler */
  const handleShare = async (platform: string) => {
    try {
      if (!reel) return;

      // 🖼️ 1️⃣ Capture the card view
      const captureUri = await cardRef.current.capture();
      if (!captureUri) {
        Alert.alert("Capture Failed", "Unable to capture reel image. Please try again.");
        return;
      }

      // 🧩 2️⃣ Copy to local accessible path
      const filePath = `${RNFS.CachesDirectoryPath}/reel_share_${Date.now()}.jpg`;
      await RNFS.copyFile(captureUri, filePath);

      const exists = await RNFS.exists(filePath);
      if (!exists) {
        Alert.alert("File Error", "Failed to save captured reel image.");
        return;
      }

      // 🧾 3️⃣ Build share message
      const title = isTelugu
        ? reel?.title_te || reel?.title_en || ""
        : reel?.title_en || reel?.title_te || "";

      const message = `${title}\n\n🎥 ${isTelugu ? "షార్ట్‌లీ యాప్‌లో చూడండి:" : "Watch on Neurom App:"
        }\nhttps://play.google.com/store/apps/details?id=com.Neurom`;

      const shareOptions = {
        title: "Share Reel",
        message,
        url: `file://${filePath}`,
        type: "image/jpeg",
      };

      // 🧠 4️⃣ Check if package installed & share
      const trySharePlatform = async (
        social: string,
        appName: string,
        packageName: string
      ) => {
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
                `Please install ${appName} on your device to share this reel.`
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

      // 🚀 5️⃣ Platform switch
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

      onClose?.();
    } catch (err) {
      console.log("❌ Reels share error:", err);
      Alert.alert("Error", "Unable to share this reel. Please try again.");
    }
  };

  const C = {
    whatsapp: "#25D366",
    instagram: "#F8F8F8",
    facebook: "#3B5998",
    x: "#FFFFFF",
    Neurom: "#997DDF",
  };
  /** 🎨 Share Buttons */
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
    <Modal visible={visible} transparent animationType="slide">
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

          <Text style={styles.headerText}>
            {t('share')}
          </Text>

          {reel?.media?.thumbnail && (
            <Image
              source={{ uri: reel.media.thumbnail }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}

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
          {/* Hidden capture view */}
          <View
            style={{
              position: "absolute",
              top: -9999,
              left: -9999,
              opacity: 0.01,
            }}
          >
            <ViewShot
              ref={cardRef}
              options={{
                format: "jpg",
                quality: 1,
                width: 1080,
                height: 1800,
              }}
            >
              <ReelShareCard reel={reel} />
            </ViewShot>
          </View>
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
    paddingBottom: fh(30),
    paddingTop: fh(14),
  },
  headerText: {
    textAlign: "center",
    fontSize: ff(18),
    fontWeight: "700",
    color: "#E0E0E0",
    marginBottom: fh(6),
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

  fullScreenClose: {
    flex: 1,
    width: "100%",
  },
  handleBar: {
    width: fw(40),
    height: fh(4),
    backgroundColor: "#bbb",
    borderRadius: fw(10),
    alignSelf: "center",
    marginBottom: fh(10),
    opacity: 0.5,
  },

});

export default ReelsShareModal;
