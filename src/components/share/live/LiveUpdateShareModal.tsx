// src/components/share/live/LiveUpdateShareModal.tsx
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
    Easing,
} from "react-native";
import Share from "react-native-share";
import ViewShot from "react-native-view-shot";
import RNFS from "react-native-fs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { fw, fh, ff } from "../../../../utils/responsive";
import { useOnboarding } from "../../../context/OnboardingContext";
import LiveUpdateShareCard from "./LiveUpdateShareCard";

interface LiveUpdateShareModalProps {
    visible: boolean;
    onClose: () => void;
    liveUpdate?: any;
}

const LiveUpdateShareModal: React.FC<LiveUpdateShareModalProps> = ({
    visible,
    onClose,
    liveUpdate,
}) => {
    const { t, getLangCode } = useOnboarding();
    const isTelugu = getLangCode() === "te";
    const cardRef = useRef<any>(null);

    const imageUrl =
        liveUpdate?.media?.type === "video"
            ? liveUpdate?.media?.thumbnail
            : liveUpdate?.media?.url;

    const handleShare = async (platform: string) => {
        try {
            if (!liveUpdate) return;

            const captureUri = await cardRef.current?.capture();
            if (!captureUri) {
                Alert.alert("Capture Error", "Unable to capture share image. Please try again.");
                return;
            }

            const filePath = `${RNFS.CachesDirectoryPath}/live_update_share_${Date.now()}.jpg`;
            await RNFS.copyFile(captureUri, filePath);

            const exists = await RNFS.exists(filePath);
            if (!exists) {
                Alert.alert("File Error", "Failed to save captured image.");
                return;
            }

            const titleEn =
                liveUpdate?.title_en || liveUpdate?.title_te || "Check this out!";
            const titleTe =
                liveUpdate?.title_te || liveUpdate?.title_en || "షార్ట్‌లీ యాప్‌లో చదవండి";

            const message = isTelugu
                ? `${titleTe}\n\nషార్ట్‌లీ యాప్‌లో చదవండి:\nhttps://play.google.com/store/apps/details?id=com.Neurom`
                : `${titleEn}\n\nRead on Neurom App:\nhttps://play.google.com/store/apps/details?id=com.Neurom`;

            const shareOptions = {
                title: "Share via",
                message,
                url: `file://${filePath}`,
                type: "image/jpeg",
            };

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
                                `Please install ${appName} on your device to share.`
                            );
                            return;
                        }
                    }

                    await Share.shareSingle({ ...shareOptions, social });
                } catch (err) {
                    console.warn(`${appName} share failed:`, err);
                    Alert.alert(
                        `Unable to share via ${appName}`,
                        "Either the app is not installed or sharing is not supported."
                    );
                }
            };

            switch (platform) {
                case "whatsapp":
                    await trySharePlatform(
                        Share.Social.WHATSAPP,
                        "WhatsApp",
                        "com.whatsapp"
                    );
                    break;

                case "telegram":
                    await trySharePlatform(
                        Share.Social.TELEGRAM,
                        "Telegram",
                        "org.telegram.messenger"
                    );
                    break;

                case "facebook":
                    await trySharePlatform(
                        Share.Social.FACEBOOK,
                        "Facebook",
                        "com.facebook.katana"
                    );
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
                        console.warn("Instagram share failed:", err);
                        Alert.alert(
                            "Instagram not available",
                            "Please ensure Instagram is installed and up to date."
                        );
                    }
                    break;

                case "x":
                    await trySharePlatform(
                        Share.Social.TWITTER,
                        "X (Twitter)",
                        "com.twitter.android"
                    );
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
            console.log("Live update share error:", err);
            Alert.alert("Error", "Unable to share this update. Please try again.");
        }
    };

    const C = {
        whatsapp: "#25D366",
        instagram: "#F8F8F8",
        facebook: "#3B5998",
        x: "#FFFFFF",
        Neurom: "#997DDF",
        telegram: "#0088cc",
    };

    const shareItems = [
        {
            key: "whatsapp",
            label: "WhatsApp",
            iconName: "logo-whatsapp",
            iconColor: "#fff",
            bgColor: C.whatsapp,
        },
        {
            key: "telegram",
            label: "Telegram",
            iconName: "navigate-sharp",
            iconColor: "#fff",
            bgColor: C.telegram,
        },
        {
            key: "facebook",
            label: "Facebook",
            iconName: "logo-facebook",
            iconColor: "#fff",
            bgColor: C.facebook,
        },
        {
            key: "instagram",
            label: "Instagram",
            iconName: "logo-instagram",
            iconColor: "#ee2a7b",
            bgColor: C.instagram,
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

    const slideAnim = useRef(new Animated.Value(fh(300))).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 420,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            slideAnim.setValue(fh(300));
        }
    }, [visible, slideAnim]);

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

                    <View style={styles.headerRow}>
                        <Text style={styles.headerText}>{t("share")}</Text>
                    </View>

                    {/* {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : null} */}

                    <FlatList
                        data={shareItems}
                        numColumns={3}
                        keyExtractor={(item) => item.key}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.item}
                                activeOpacity={0.8}
                                onPress={() => handleShare(item.key)}
                            >
                                <View
                                    style={[
                                        styles.iconWrapper,
                                        { backgroundColor: item.bgColor },
                                    ]}
                                >
                                    <Ionicons
                                        name={item.iconName}
                                        size={fw(20)}
                                        color={item.iconColor}
                                    />
                                </View>
                                <Text style={styles.label}>{item.label}</Text>
                            </TouchableOpacity>
                        )}
                    />

                    <View
                        style={{
                            position: "absolute",
                            top: -9999,
                            left: -9999,
                            opacity: 0.01,
                        }}
                        pointerEvents="none"
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
                            <LiveUpdateShareCard liveUpdate={liveUpdate} />
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
        width: "33.33%",
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
        paddingHorizontal: fw(2),
        width: "100%",
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

export default LiveUpdateShareModal;
