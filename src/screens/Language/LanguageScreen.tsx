import React, { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientScreen from "../../components/GradientScreen";
import { fw, fh, ff } from "../../../utils/responsive";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { InteractionManager } from "react-native";

// ✅ Import from your API
import { publicLanguages } from "../../api/publicapi/publicApi";

const LanguageScreen = () => {
  const navigation = useNavigation<any>();
  const { Colors, barStyle } = useTheme();
  const { t, getFont } = useOnboarding();

  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const fetchLanguages = async () => {
      try {
        const result = await publicLanguages.list();

        if (result?.data?.items?.length) {

          const mapped = result.data.items.map((lang: any) => {
            const code = lang.code;

            // ✅ Telugu → show 'తె', English → show 'E', all others → show backend code
            let displayCode = code;
            if (code === "te") displayCode = "తె";
            else if (code === "en") displayCode = "E";

            return {
              id: lang.language_id,
              code,           // ✅ backend-safe code for registration (te/en/hi/ta/etc.)
              displayCode,    // ✅ for frontend display
              label: lang.name,
            };
          });

          setLanguages(mapped);

          // ✅ Default select Telugu if available, else first
          const teluguLang =
            mapped.find((l) => l.code === "te") || mapped[0];

          setSelectedLang(teluguLang);
        }
      } catch (error) {
        console.error("❌ Error fetching languages:", error);
        Alert.alert(t("error"), t("error_fetch_languages"));
      } finally {
        setLoading(false);
      }
    };


    fetchLanguages();

  }, []);

  const handleProceed = useCallback(() => {
    if (selectedLang) {
      navigation.navigate("VoiceScreen", {
        language_id: selectedLang.id,
        language_code: selectedLang.code,
      });
    } else {
      Alert.alert(t("validation"), t("please_select_language"));
    }
  }, [selectedLang, navigation, t]);

  return (
    <GradientScreen>
      <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />

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
            >
              {t("select_language")}
            </Text>

            <View style={styles.rightSpacer} />
          </View>
        </SafeAreaView>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.lavenderPurple}
            style={styles.loader}
          />
        ) : (
          <>
            {/* Language list */}
            <FlatList
              data={languages}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item: lang }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedLang(lang);
                  }}
                >
                  {selectedLang?.id === lang.id ? (
                    <LinearGradient
                      colors={["#997DDF", "#7741FF"]}
                      style={styles.selectedCard}
                    >
                      <Text style={[styles.langLabel, { color: "#fff" }]}>
                        {lang.label}
                      </Text>
                      <View style={[styles.langCircle, { borderColor: Colors.lavenderPurple }]}>
                        <Text style={[styles.circleText, { color: "#fff" }]}>
                          {lang.displayCode}
                        </Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.unselectedCard,
                        { borderColor: Colors.textcolor },
                      ]}
                    >
                      <Text style={[styles.langLabel, { color: Colors.textcolor }]}>
                        {lang.label}
                      </Text>
                      <View
                        style={[
                          styles.langCircle,
                          { borderColor: Colors.textcolor },
                        ]}
                      >
                        <Text style={[styles.circleText, { color: Colors.textcolor }]}>
                          {lang.displayCode}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            />

            {/* Subheading */}
            <View style={styles.staticTop}>
              <Text
                style={[
                  styles.heading,
                  { color: Colors.textcolor, fontFamily: getFont("regular") },
                ]}
              >
                {t("change_preference_later")}
              </Text>
            </View>

            {/* Proceed button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleProceed}>
                <LinearGradient
                  useAngle
                  angle={200}
                  angleCenter={{ x: 0.7, y: 0.5 }}
                  colors={["#997DDF", "#7741FF"]}
                  style={styles.proceedButton}
                >
                  <Text
                    style={[
                      styles.proceedText,
                      { color: "#fff", fontFamily: getFont("regular") },
                    ]}
                  >
                    {t("submit")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  leftIcon: { width: fw(24), height: fh(24), marginLeft: fw(16) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: ff(18),
    fontWeight: "600",
    paddingHorizontal: fw(8), // ✅ Add padding to prevent truncation
  },
  rightSpacer: { width: fw(32) },

  scrollContent: {
    paddingHorizontal: fw(20),
    marginTop: fh(40),
    alignItems: "center",
    paddingBottom: fh(40),
    gap: fh(20),
  },

  staticTop: {
    paddingHorizontal: fw(20),
    paddingTop: fh(16),
    marginBottom: fh(35)
  },

  heading: {
    fontSize: ff(14),
    textAlign: "center",
    opacity: 0.9,
    lineHeight: ff(20), // ✅ Use ff() for consistent line height
    paddingHorizontal: fw(4), // ✅ Prevent edge truncation
  },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

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

  langLabel: {
    fontSize: ff(16),
    fontWeight: "500",
    flex: 1, // ✅ Allow text to take available space
    marginRight: fw(8), // ✅ Space between label and circle
    includeFontPadding: false, // ✅ Android-specific: removes extra padding
  },

  langCircle: {
    width: fw(40),
    height: fw(40),
    borderRadius: fw(20),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0, // ✅ Prevent circle from shrinking
  },

  circleText: {
    fontSize: ff(18),
    fontWeight: "600",
    includeFontPadding: false, // ✅ Android-specific
    textAlign: "center", // ✅ Ensure centered
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

export default LanguageScreen;
