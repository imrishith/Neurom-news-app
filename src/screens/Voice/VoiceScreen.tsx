// screens/Onboarding/GenderScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  UIManager,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  InteractionManager,
  FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import GradientScreen from "../../components/GradientScreen";
import { fw, fh, ff } from "../../../utils/responsive";
import { useTheme } from "../../context/ThemeContext";
import DeviceInfo from "react-native-device-info";
import { registerDevice, updateDevice } from "../../api/device/deviceService";
import { useOnboarding } from "../../context/OnboardingContext";
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';

const GenderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { Colors, barStyle } = useTheme();
  const { t, getFont, data, updateData } = useOnboarding();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const route = useRoute<any>();
  const { language_id, language_code } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const [genders] = useState([
    {
      code: "Female",
      label: t("female"),
      icon: require("../../../assets/icons/female.png"),
    },
    {
      code: "Male",
      label: t("male"),
      icon: require("../../../assets/icons/male.png"),
    },
  ]);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          console.log("✅ FCM Token:", token);
          setFcmToken(token);
        } else {
          console.warn("🚫 Permission for push notifications not granted");
        }
      } catch (error) {
        console.error("🔥 FCM setup failed:", error);
      }
    });
    return () => task.cancel();
  }, []);


  const handleSelect = useCallback((code: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(code);
  }, []);


  const handleProceed = useCallback(async () => {
    try {
      if (!selected) {
        Alert.alert(t("validation"), t("please_select_voice"));
        return;
      }

      setLoading(true);
      const device_id = DeviceInfo.getUniqueIdSync();

      console.log("My device_id", device_id);

      const payload = {
        device_id,
        fcm_token: fcmToken,
        language_id,
        voice: selected,
        state_id: data.state_id,
        district_id: data.district_id,
        constituency_id: data.constituency_id,
        mandal_id: data.mandal_id,
        village_id: data.village_id,
        os_type: Platform.OS,
        os_version: DeviceInfo.getSystemVersion(),
        app_version: DeviceInfo.getVersion(),
        model_name: DeviceInfo.getModel(),
        device_brand: DeviceInfo.getBrand(),
      };

      if (data.device_id) {
        const updated = await updateDevice({
          device_id: data.device_id,
          language_id,
          voice: selected,
        });

        updateData({
          ...data,
          language_id: updated.device.language_id,
          voice: updated.device.voice,
          isRegistered: true,
        });

        navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] });
      } else {
        const res = await registerDevice(payload);

        if (res?.success) {
          updateData({
            device_id: res.data.device_id,
            language_id: res.data.language_id,
            state_id: res.data.state_id,
            district_id: res.data.district_id,
            mandal_id: res.data.mandal_id,
            village_id: res.data.village_id,
            constituency_id: res.data.constituency_id,
            voice: res.data.voice,
            isRegistered: true,
            language_code
          });

          navigation.reset({
            index: 0,
            routes: [{ name: "HomeScreen", params: { user: res.data } }],
          });
        }
      }
    } catch (err: any) {
      if (err.response) {
        console.error("❌ Register failed:", err.response.data);
        Alert.alert("Error", JSON.stringify(err.response.data, null, 2));
      } else {
        console.error("❌ Register failed:", err.message);
        Alert.alert("Error", err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [selected, fcmToken, language_id, language_code, data, navigation, t]);

  return (
    <GradientScreen>
      <StatusBar translucent backgroundColor="transparent" barStyle={barStyle} />

      <View style={styles.mainContainer}>
        {/* Header */}
        <SafeAreaView edges={["top"]} style={styles.safeTop}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack?.()}
              style={styles.leftIconHitSlop}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={require("../../../assets/icons/backarrow.png")}
                style={[styles.leftIcon, { tintColor: Colors.lavenderPurple }]}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.headerTitle,
                { color: Colors.textcolor, fontFamily: getFont("semibold") },
              ]}
              numberOfLines={1} // ✅ Prevent overflow
              allowFontScaling={false} // ✅ Prevent system scaling
            >
              {t("select_voice")}
            </Text>

            <View style={styles.rightSpacer} />
          </View>
        </SafeAreaView>

        {/* Gender cards list */}
        <FlatList
          data={genders}
          keyExtractor={(item) => item.code}
          renderItem={({ item: g }) => {
            const isSelected = selected === g.code;
            const textColor = isSelected ? "#fff" : Colors.textcolor;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleSelect(g.code)}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={["#997DDF", "#7741FF"]}
                    style={styles.selectedCard}
                  >
                    <View style={styles.labelContainer}>
                      <Text style={[styles.genderLabel, { color: textColor }]}>
                        {g.label}
                      </Text>
                    </View>
                    <View style={styles.rightGroup}>
                      <Image
                        source={require("../../../assets/icons/wave.png")}
                        style={[styles.waveOutside, { tintColor: textColor }]}
                      />
                      <View
                        style={[
                          styles.rightIconsContainer,
                          { borderColor: Colors.lavenderPurple },
                        ]}
                      >
                        <Image source={g.icon} style={styles.userIcon} />
                      </View>
                    </View>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.unselectedCard,
                      { borderColor: Colors.textcolor },
                    ]}
                  >
                    <View style={styles.labelContainer}>
                      <Text style={[styles.genderLabel, { color: textColor }]}>
                        {g.label}
                      </Text>
                    </View>
                    <View style={styles.rightGroup}>
                      <Image
                        source={require("../../../assets/icons/wave.png")}
                        style={[styles.waveOutside, { tintColor: textColor }]}
                      />
                      <View
                        style={[
                          styles.rightIconsContainer,
                          { borderColor: Colors.textcolor },
                        ]}
                      >
                        <Image
                          source={g.icon}
                          style={[styles.userIcon, { tintColor: textColor }]}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        />


        {/* Subheading */}
        <View style={styles.staticTop}>
          <Text
            style={[
              styles.heading,
              { color: Colors.textcolor, fontFamily: getFont("regular") },
            ]}
            numberOfLines={2} // ✅ Allow 2 lines if needed
            allowFontScaling={false} // ✅ Prevent system scaling
          >
            {t("change_preference_later")}
          </Text>
        </View>

        {/* Proceed button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => {
              if (!loading) handleProceed();
            }}
            activeOpacity={0.9}
            disabled={loading}
          >
            <LinearGradient
              useAngle
              angle={187.69}
              angleCenter={{ x: 0.5, y: 0.5 }}
              colors={["#997DDF", "#7741FF"]}
              style={styles.proceedButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.proceedText,
                    { color: "#fff", fontFamily: getFont("regular") },
                  ]}
                  allowFontScaling={false} // ✅ Prevent system scaling
                >
                  {t("proceed")}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  safeTop: { backgroundColor: "transparent" },
  headerContent: {
    height: fh(56),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: fw(12),
    marginTop: fh(50),
  },
  leftIconHitSlop: {
    width: fw(32),
    height: fh(32),
    justifyContent: "center",
    alignItems: "center",
  },
  leftIcon: {
    width: fw(24),
    height: fh(24),
    marginLeft: fw(16),
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: ff(18),
    fontWeight: "600",
    paddingHorizontal: fw(8), // ✅ Add padding to prevent truncation
    includeFontPadding: false, // ✅ Android-specific
  },
  rightSpacer: { width: fw(32) },

  staticTop: {
    paddingHorizontal: fw(24),
    paddingTop: fh(16),
    marginBottom: fh(35),
  },

  heading: {
    fontSize: ff(14),
    textAlign: "center",
    opacity: 0.9,
    lineHeight: ff(20), // ✅ Use ff() for consistency
    includeFontPadding: false, // ✅ Android-specific
  },

  container: {
    paddingHorizontal: fw(20),
    marginTop: fh(30),
    paddingBottom: fh(40),
    alignItems: "center",
    gap: fh(20),
  },

  selectedCard: {
    width: fw(342),
    height: fh(60),
    borderRadius: fw(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: fw(20), // ✅ Increased from 16
    paddingVertical: fh(10), // ✅ Add vertical padding
  },
  unselectedCard: {
    width: fw(342),
    height: fh(60),
    borderRadius: fw(12),
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: fw(20), // ✅ Increased from 16
    paddingVertical: fh(10), // ✅ Add vertical padding
  },

  // ✅ NEW: Container for label text
  labelContainer: {
    flex: 1, // ✅ Take available space
    marginRight: fw(12), // ✅ Space before right group
  },

  genderLabel: {
    fontSize: ff(16),
    fontWeight: "500",
    includeFontPadding: false, // ✅ Android-specific
  },

  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0, // ✅ Prevent shrinking
  },

  waveOutside: {
    width: fw(26),
    height: fh(26),
    resizeMode: "contain",
    marginRight: fw(12), // ✅ Reduced from 20 for better spacing
  },

  rightIconsContainer: {
    width: fw(40),
    height: fw(40),
    borderRadius: fw(20),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",


  },

  userIcon: {
    width: fw(22),
    height: fh(22),
    resizeMode: "contain",
  },

  buttonContainer: {
    paddingHorizontal: fw(35),
    paddingBottom: fh(120),
  },
  proceedButton: {
    borderRadius: fw(8),
    height: fh(50),
    width: fw(300),
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: fw(16), // ✅ Add padding for text
  },
  proceedText: {
    fontSize: ff(16),
    textAlign: "center",
    fontWeight: "600",
    includeFontPadding: false, // ✅ Android-specific
  },
});

export default GenderScreen;