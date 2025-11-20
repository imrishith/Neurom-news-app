import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import Modal from "react-native-modal";
import LinearGradient from "react-native-linear-gradient";
import { fw, fh, ff } from "../../../../utils/responsive";
import { useTheme } from "../../../context/ThemeContext";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reporterProfile } from "../../../api/reporter/reporterApi";


interface SidebarItem {
  key: string;
  label: string;
  onPress: () => void;
}

interface SidebarPanelProps {
  visible: boolean;
  onClose: () => void;
  avatar?: ImageSourcePropType;
  greeting?: string;
  subtitle?: string;
  items: SidebarItem[];
  onPhotoUpdated?: (newPhotoUrl: string) => void;
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  visible,
  onClose,
  avatar = require("../../../../assets/images/profile.jpg"),
  greeting = "Hi Reporter 👋",
  subtitle = "Reporter for your region",
  items = [],
  onPhotoUpdated,
}) => {
  const { Colors } = useTheme();
  const [uploading, setUploading] = React.useState(false);

  const handleChangeAvatar = async () => {
    try {
      // Step 1: Open gallery
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
      });

      // If user cancelled
      if (result.didCancel) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      // Step 2: Upload to API
      setUploading(true);

      const fileUri = asset.uri;
      const fileName = asset.fileName || "profile.jpg";
      const mimeType = asset.type || "image/jpeg";

      const response = await reporterProfile.uploadPhoto(fileUri, fileName, mimeType);

      // Step 3: Handle API response
      if (response.success) {
        // Update local profile in AsyncStorage
        const stored = await AsyncStorage.getItem("reporterProfile");
        let parsed = stored ? JSON.parse(stored) : {};
        parsed.photo = response.data.photo;
        await AsyncStorage.setItem("reporterProfile", JSON.stringify(parsed));

        console.log("✅ Profile photo updated successfully!");
        if (response?.data?.photo && onPhotoUpdated) {
          onPhotoUpdated(response.data.photo);
        }
      } else {
        console.log("❌ Upload failed:", response.message);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };


  return (
    <Modal
      isVisible={visible}
      animationIn="slideInLeft"
      animationOut="slideOutLeft"
      backdropOpacity={0.35}
      onBackdropPress={onClose}
      style={styles.modal}
    >
      <LinearGradient
        useAngle
        angle={180}
        angleCenter={{ x: 0.5, y: 0.5 }}
        colors={[Colors.deepPurple, Colors.darkpurple]}
        style={styles.sidebarContainer}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.8}>
            <Image
              source={avatar}
              style={[
                styles.avatar,
                uploading && { opacity: 0.5 },
              ]}
            />
            {uploading && (
              <View
                style={{
                  position: "absolute",
                  width: fw(52),
                  height: fw(52),
                  borderRadius: fw(26),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: ff(10) }}>Uploading...</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.greeting,
                { color: Colors.textcolor },
              ]}
              numberOfLines={1}
            >
              {greeting}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: Colors.mediumGray },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: Colors.mediumGray,
            opacity: 0.3,
            marginBottom: fh(20),
          }}
        />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.85}
              onPress={() => {
                item.onPress();
                onClose();
              }}
              style={[
                styles.menuItem,
                { borderBottomColor: Colors.mediumGray },
              ]}
            >
              <Text
                style={[
                  styles.menuText,
                  { color: Colors.textcolor },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  sidebarContainer: {
    width: fw(240),
    height: "100%",
    paddingVertical: fh(20),
    paddingHorizontal: fw(16),
    borderTopRightRadius: fw(20),
    borderBottomRightRadius: fw(20),
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: fh(16),
  },
  avatar: {
    width: fw(52),
    height: fw(52),
    borderRadius: fw(26),
    marginRight: fw(12),
  },
  greeting: {
    fontSize: ff(14),
    fontWeight: "600",
  },
  subtitle: {
    fontSize: ff(12),
    marginTop: fh(2),
  },
  menuContainer: {
    flexDirection: "column",
  },
  menuItem: {
    paddingVertical: fh(12),
    borderBottomWidth: 0.5,
  },
  menuText: {
    fontSize: ff(14),
    fontWeight: "500",
  },
});

export default SidebarPanel;
