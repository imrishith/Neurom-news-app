// screens/PostNewsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  BackHandler
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary, Asset } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import GradientScreen from "../../../components/GradientScreen";
import AppHeader from "../../../components/AppHeader";
import Colors from "../../../constants/colors";
import { fw, fh, ff, fr, getLayoutConfig } from "../../../../utils/responsive";
import { useTheme } from "../../../context/ThemeContext";
import { useOnboarding } from "../../../context/OnboardingContext";
import { reporterArticles } from "../../../api/reporter/reporterApi";
import { API_CONFIG } from "../../../api/config/apiConfig";
import { getTeluguSuggestions } from "../../../../utils/inputToolsHelper";
import { useNavigation } from "@react-navigation/native";
// ---------------- Helpers ----------------
const MAX_IMG = 3 * 1024 * 1024; // 3MB
const MAX_VID = 10 * 1024 * 1024; // 10MB
const TITLE_LIMIT = 80;
const DESC_LIMIT = 600;


// =================================================================
// 🚀 LOCATION SEARCH MODAL COMPONENT
// =================================================================
const LocationSearchModal = ({
  isVisible,
  onClose,
  locQuery,
  setLocQuery,
  locResults,
  locLoading,
  searchLocations,
  setSelectedLoc,
  Colors,
  getFont,
  t,
}: any) => {
  const onSelectLocation = (loc: any) => {
    setSelectedLoc(loc);
    setLocQuery(
      `${loc.village_name || loc.village_name_en}, ${loc.district?.district_name || loc.district?.district_name_en}`
    );
    onClose();
    Keyboard.dismiss();
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <SafeAreaView style={[modalStyles.container, { backgroundColor: Colors.background }]}>
        {/* Header */}
        <AppHeader
          backgroundColor="transparent"
          showBottomDivider={false}
          safeTopPadding
          title={t("search_location")}
          titleStyle={{ fontSize: ff(16), fontFamily: getFont("semibold") }}
          onLeftPress={onClose}
        />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={modalStyles.content}>
            {/* Search Input */}
            <View style={modalStyles.searchBarWrapper}>
              <Ionicons
                name="search"
                size={fw(18)}
                color={Colors.mediumGray}
                style={{ marginHorizontal: fw(8) }}
              />
              <TextInput
                style={[
                  modalStyles.searchInput,
                  {
                    fontFamily: getFont("regular"),
                    color: Colors.textcolor,
                  },
                ]}
                placeholder={t("search_village_district")}
                placeholderTextColor={Colors.mediumGray}
                value={locQuery}
                onChangeText={searchLocations}
                autoFocus
              />
            </View>

            {locLoading && (
              <ActivityIndicator color={Colors.primaryColor} style={modalStyles.loading} />
            )}

            <ScrollView
              style={modalStyles.resultsScroll}
              contentContainerStyle={{ paddingVertical: fh(8) }}
            >
              {locResults.length > 0 ? (
                locResults.map((loc: any) => (
                  <TouchableOpacity
                    key={loc.village_id}
                    style={[modalStyles.dropdownItem, { backgroundColor: Colors.deepPurple }]}
                    activeOpacity={0.7}
                    onPress={() => onSelectLocation(loc)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={fw(18)}
                      color={Colors.lavenderPurple}
                      style={{ marginRight: fw(8) }}
                    />
                    <Text
                      style={[
                        modalStyles.dropdownText,
                        { color: Colors.textcolor },
                      ]}
                    >
                      {loc.village_name},{" "}
                      {loc.mandal?.mandal_name},
                      {loc.district?.district_name},{" "}
                      {loc.state?.state_name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                !locLoading &&
                locQuery.length > 1 && (
                  <Text
                    style={[
                      modalStyles.noResultsText,
                      { color: Colors.mediumGray },
                    ]}
                  >
                    {t("no_locations_found")}
                  </Text>
                )
              )}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );
};

// =================================================================
// 📰 MAIN POST NEWS SCREEN
// =================================================================
const PostNewsScreen = ({ navigation }: any) => {
  const { Colors, barStyle } = useTheme();
  const { t, getFont } = useOnboarding();

  const [language, setLanguage] = useState<"en" | "te">("en");
  const [media, setMedia] = useState<Asset | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState<any[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<any>(null);
  const [isLocModalVisible, setIsLocModalVisible] = useState(false);
   
  const [catValue, setCatValue] = useState<any>(null);
  const [catItems, setCatItems] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catOpen, setCatOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Title suggestions
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);

  // Content suggestions
  const [contentSuggestions, setContentSuggestions] = useState<string[]>([]);
  const [showContentSuggestions, setShowContentSuggestions] = useState(false);
  

      
  // ---------------------- Media Picker ----------------------
  const pickMedia = async () => {
    const res = await launchImageLibrary({ mediaType: "mixed", selectionLimit: 1, quality: 0.9 });
    if (res.didCancel) return;
    const asset = res.assets?.[0];
    if (!asset) return;

    const size = asset.fileSize ?? 0;
    const type = asset.type ?? "";

    setMedia(asset);
  };
  const clearMedia = () => setMedia(null);

    // backhandler done by rishith
            useEffect(() => {
              const backAction = () => {
                // ✅ Navigate to Home instead of exiting the app
                navigation.navigate("ReporterDashboardScreen"); // change to your actual home route name
                return true; // prevent default back behavior (app exit)
              };
          
              const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
              );
          
              return () => backHandler.remove();
            }, [navigation]);
  

  // ---------------------- Fetch Categories ----------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_CONFIG.baseUrl}/public/users/categories`);
        if (res.data.success) {
          const cats = res.data.data.items.map((c: any) => ({
            label: c.display_name_en,
            value: c.category_id,
          }));
          setCatItems(cats);
        }
      } catch (err) {
        console.error("❌ Failed to fetch categories:", err);
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  // ---------------------- Location Search ----------------------
  const searchLocations = async (text: string) => {
    setLocQuery(text);
    if (text.length < 2) {
      setLocResults([]);
      return;
    }
    try {
      setLocLoading(true);
      const profileStr = await AsyncStorage.getItem("reporterProfile");
    const profile = profileStr ? JSON.parse(profileStr) : null;
    const districtId = profile?.assigned_district_id;

    if (!districtId) {
      Alert.alert("Error", "District ID not found in your profile");
      return;
    }
      const res = await axios.get(
        `${API_CONFIG.baseUrl}/public/locations/villages/search/by-district?districtId=${districtId}&searchTerm=${text}`
      );
      if (res.data.success && Array.isArray(res.data.data)) {
        setLocResults(res.data.data);
      } else {
        setLocResults([]);
      }
    } catch (err) {
      console.error("❌ Location search failed:", err);
      setLocResults([]);
    } finally {
      setLocLoading(false);
    }
  };

  // ---------------------- Submit Article ----------------------
  const onSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Not logged in", "Please login to continue");
        navigation.replace("ProfileWelcomeScreen");
        return;
      }

      if (!title || !desc || !catValue || !selectedLoc) {
        Alert.alert("Validation", "Please fill all fields");
        return;
      }

      const formData = new FormData();

      // ✅ Dynamic language handling
      if (language === "te") {
        formData.append("title_te", title);
        formData.append("content_te", desc);
      } else {
        formData.append("title_en", title);
        formData.append("content_en", desc);
      }

      formData.append("category_id", catValue);
      formData.append("state_id", selectedLoc?.state?.state_id);
      formData.append("district_id", selectedLoc?.district?.district_id);
      formData.append("constituency_id", selectedLoc?.constituency?.constituency_id);
      formData.append("mandal_id", selectedLoc?.mandal?.mandal_id);
      formData.append("village_id", selectedLoc?.village_id);

      if (media) {
        formData.append("media", {
          uri: media.uri,
          name: media.fileName || "upload.jpg",
          type: media.type || "image/jpeg",
        } as any);
      }
    
      const json = await reporterArticles.create(formData);

      if (json.success) {
        Alert.alert("Success", "Article submitted successfully");
        navigation.goBack();
      } else {
        Alert.alert("Failed", json.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error("❌ API Error:", err);
      Alert.alert("Error", err.message || "Network request failed");
    }
  };

  // ---------------------- Helpers ----------------------
  const getSelectedLocDisplay = () => {
    if (selectedLoc) {
      return `${selectedLoc.village_name}, ${selectedLoc.mandal?.mandal_name}, ${selectedLoc.district?.district_name}`;
    }
    return t("select_location_placeholder");
  };

  // ---------------------- UI ----------------------
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <GradientScreen>
        <StatusBar translucent backgroundColor="transparent" barStyle={barStyle} />
        <AppHeader
          backgroundColor="transparent"
          showBottomDivider={false}
          safeTopPadding
          title={`Post News (${language === "te" ? "తెలుగు" : "English"})`}
          titleStyle={{ fontSize: ff(16), fontFamily: getFont("semibold") }}
          leftComponents={[
            <Image
              key="back"
              source={require("../../../../assets/icons/backarrow.png")}
              style={{ width: fw(24), height: fw(24) }}
            />,
          ]}
          onLeftPress={() => navigation.goBack?.()}
        />

        {/* 🈳 Language Toggle */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginVertical: fh(10),
          }}
        >
          {/* Telugu Button */}
          <TouchableOpacity
            onPress={() => setLanguage("te")}
            style={[
              styles.langButton,
              language === "te" && styles.langButtonActive, // highlight when active
            ]}
          >
            <Text
              style={[
                styles.langButtonText,
                language === "te" && styles.langButtonTextActive,
                language === "te" && { fontFamily: getFont("semibold") },
                language !== "te" && { fontFamily: getFont("regular") },
              ]}
            >
              తెలుగు
            </Text>
          </TouchableOpacity>

          {/* English Button */}
          <TouchableOpacity
            onPress={() => setLanguage("en")}
            style={[
              styles.langButton,
              language === "en" && styles.langButtonActive,
            ]}
          >
            <Text
              style={[
                styles.langButtonText,
                language === "en" && styles.langButtonTextActive,
                language === "en" && { fontFamily: getFont("semibold") },
                language !== "en" && { fontFamily: getFont("regular") },
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
        </View>


        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: fw(16), paddingBottom: fh(40) }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Upload */}
          <Text style={[styles.label, { fontFamily: getFont("medium"), color: Colors.textcolor }]}>
            {t("upload")}
          </Text>
          <TouchableOpacity
            onPress={pickMedia}
            style={[styles.uploadBox, media && { padding: 0 }, { backgroundColor: Colors.deepPurple }]}
          >
            {!media ? (
              <>
                <Text style={[styles.uploadPlaceholder, { fontFamily: getFont("regular") }]}>
                  {t("upload_video_image")}
                </Text>
                <Text style={styles.helperText}>Image : 3MB, Video : 10MB</Text>
              </>
            ) : (
              <View style={styles.previewWrap}>
                <Image source={{ uri: media.uri }} style={styles.previewImage} />
                <TouchableOpacity onPress={clearMedia} style={styles.removePill}>
                  <Text style={styles.removePillText}>{t("remove")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.label, { fontFamily: getFont("medium"), color: Colors.textcolor }]}>
            {language === "te" ? "శీర్షిక" : t("title")}
          </Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, { fontFamily: getFont("regular"), backgroundColor: Colors.deepPurple }]}
              placeholder={language === "te" ? "శీర్షికను నమోదు చేయండి" : t("title_placeholder")}
              placeholderTextColor={Colors.mediumGray}
              value={title}
              onChangeText={async (text) => {
                setTitle(text);
                if (language === "te") {
                  try {
                    const data = await getTeluguSuggestions(text);
                    setTitleSuggestions(data);
                    setShowTitleSuggestions(data.length > 0);
                  } catch (err) {
                    console.error("Title suggestion fetch failed", err);
                  }
                } else {
                  setTitleSuggestions([]);
                  setShowTitleSuggestions(false);
                }
              }}


              maxLength={TITLE_LIMIT}
            />
            {showTitleSuggestions && titleSuggestions.length > 0 && (
              <View
                style={{
                  backgroundColor: Colors.deepPurple,
                  borderRadius: 6,
                  marginTop: fh(4),
                  paddingVertical: fh(6),
                  maxHeight: fh(150),
                }}
              >
                <ScrollView>
                  {titleSuggestions.map((s, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setTitle(s);
                        setShowTitleSuggestions(false);
                      }}
                      style={{
                        paddingVertical: fh(6),
                        paddingHorizontal: fw(12),
                      }}
                    >
                      <Text style={{ color: Colors.textcolor, fontSize: ff(14) }}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}



            <Text style={styles.helperText}>{title.length}/{TITLE_LIMIT}</Text>
          </View>

          {/* Description */}
          <Text style={[styles.label, { fontFamily: getFont("medium"), color: Colors.textcolor }]}>
            {language === "te" ? "వివరణ" : t("description")}
          </Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={[
                styles.input,
                {
                  height: fh(120),
                  fontFamily: getFont("regular"),
                  backgroundColor: Colors.deepPurple,
                  textAlignVertical: "top",
                },
              ]}
              placeholder={
                language === "te"
                  ? "వివరణను నమోదు చేయండి"
                  : t("description_placeholder")
              }
              placeholderTextColor={Colors.mediumGray}
              multiline
              value={desc}
              onChangeText={async (text) => {
                setDesc(text);
                if (language === "te") {
                  try {
                    const data = await getTeluguSuggestions(text);
                    setContentSuggestions(data);
                    setShowContentSuggestions(data.length > 0);
                  } catch (err) {
                    console.error("Content suggestion fetch failed", err);
                  }
                } else {
                  setContentSuggestions([]);
                  setShowContentSuggestions(false);
                }
              }}

              maxLength={DESC_LIMIT}
            />

            {showContentSuggestions && contentSuggestions.length > 0 && (
              <View
                style={{
                  backgroundColor: Colors.deepPurple,
                  borderRadius: 6,
                  marginTop: fh(4),
                  paddingVertical: fh(6),
                  maxHeight: fh(150),
                }}
              >
                <ScrollView>
                  {contentSuggestions.map((s, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setDesc(s);
                        setShowContentSuggestions(false);
                      }}
                      style={{
                        paddingVertical: fh(6),
                        paddingHorizontal: fw(12),
                      }}
                    >
                      <Text style={{ color: Colors.textcolor, fontSize: ff(14) }}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}



            <Text style={styles.helperText}>
              {desc.length}/{DESC_LIMIT}
            </Text>
          </View>


          {/* Category */}
          <Text style={[styles.label, { fontFamily: getFont("medium"), color: Colors.textcolor }]}>
            {t("category")}
          </Text>
          <View style={styles.dropdownWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.prefRowBase, { backgroundColor: Colors.deepPurple }]}
              onPress={() => setCatOpen((prev) => !prev)}
            >
              <Text style={[styles.prefTitle, { color: Colors.textcolor, fontFamily: getFont("regular") }]}>
                {catValue
                  ? catItems.find((c) => c.value === catValue)?.label
                  : t("select_category")}
              </Text>
              <Text style={styles.chev}>{catOpen ? "▴" : "▾"}</Text>
            </TouchableOpacity>

            {catOpen && (
              <View style={[styles.dropdownPanel, { backgroundColor: Colors.deepPurple, left: 7 }]}>
                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                  {catItems.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCatValue(cat.value);
                        setCatOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownText, { color: Colors.textcolor }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Location */}
          <Text style={[styles.label, { fontFamily: getFont("medium"), color: Colors.textcolor }]}>
            {t("location")}
          </Text>
          <TouchableOpacity
            style={[styles.input, styles.locationInput, { backgroundColor: Colors.deepPurple }]}
            onPress={() => setIsLocModalVisible(true)}
          >
            <Text
              style={{
                fontFamily: getFont("regular"),
                color: selectedLoc ? Colors.textcolor : Colors.mediumGray,
              }}
            >
              {getSelectedLocDisplay()}
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity onPress={onSubmit} style={{ marginTop: fh(20) }}>
            <LinearGradient
              colors={["#997DDF", "#7741FF"]}
              style={styles.submitGradient}
            >
              <Text style={[styles.submitText, { fontFamily: getFont("semibold") }]}>
                {t("submit")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </GradientScreen>

      {/* 🚀 Location Search Modal */}
      <LocationSearchModal
        isVisible={isLocModalVisible}
        onClose={() => setIsLocModalVisible(false)}
        locQuery={locQuery}
        setLocQuery={setLocQuery}
        locResults={locResults}
        locLoading={locLoading}
        searchLocations={searchLocations}
        setSelectedLoc={setSelectedLoc}
        Colors={Colors}
        getFont={getFont}
        t={t}
      />
    </SafeAreaView>
  );
};

// =================================================================
// 🖌️ Styles
// =================================================================
const styles = StyleSheet.create({
  langToggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: fh(getLayoutConfig().isTablet ? 14 : 10),
    gap: fw(getLayoutConfig().isTablet ? 16 : 12),
  },
  langToggleBtn: {
    paddingVertical: fh(getLayoutConfig().isTablet ? 12 : 8),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 24 : 20),
    borderRadius: fr(20),
    borderWidth: 1,
    borderColor: "#997DDF",
  },
  langActive: {
    backgroundColor: "#997DDF",
  },
  langText: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    fontFamily: "Poppins-Medium",
    includeFontPadding: false,
  },

  label: {
    color: Colors.textcolor,
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    marginTop: fh(getLayoutConfig().isTablet ? 20 : 15),
    marginBottom: fh(getLayoutConfig().isTablet ? 14 : 10),
    includeFontPadding: false,
  },
  uploadBox: {
    height: fh(getLayoutConfig().isTablet ? 200 : 170),
    borderRadius: fr(6),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: fh(getLayoutConfig().isTablet ? 12 : 8),
    position: "relative",
    width: "100%",
    maxWidth: fw(getLayoutConfig().isTablet ? 400 : 346),
    alignSelf: "center",
  },
  uploadPlaceholder: { 
    color: Colors.mediumGray,
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  helperText: {
    position: "absolute",
    bottom: fh(getLayoutConfig().isTablet ? 8 : 6),
    right: fw(getLayoutConfig().isTablet ? 24 : 20),
    fontSize: ff(getLayoutConfig().isTablet ? 12 : 10),
    color: Colors.mediumGray,
  },
  previewWrap: { width: "100%", height: "100%", backgroundColor: "#241B35" },
  previewImage: { width: "100%", height: "100%" },
  removePill: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "#0006",
    padding: fw(getLayoutConfig().isTablet ? 8 : 5),
    borderRadius: fr(6),
  },
  removePillText: { 
    color: "#fff", 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12),
    includeFontPadding: false,
  },

  inputWrap: {
    position: "relative",
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 12),
  },
  input: {
    backgroundColor: Colors.deepPurple,
    color: Colors.textcolor,
    padding: fw(getLayoutConfig().isTablet ? 14 : 10),
    borderRadius: fr(6),
    width: "100%",
    maxWidth: fw(getLayoutConfig().isTablet ? 400 : 346),
    alignSelf: "center",
    height: fh(getLayoutConfig().isTablet ? 56 : 46),
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  locationInput: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: fw(getLayoutConfig().isTablet ? 14 : 10),
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 12),
  },
  submitGradient: {
    height: fh(getLayoutConfig().isTablet ? 56 : 46),
    borderRadius: fr(6),
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: fw(getLayoutConfig().isTablet ? 400 : 346),
    alignSelf: "center",
    marginTop: fh(getLayoutConfig().isTablet ? 30 : 20),
  },
  submitText: { 
    color: Colors.textcolor, 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  dropdownWrap: { 
    position: "relative", 
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 12),
    alignSelf: "center",
    width: "100%",
    maxWidth: fw(getLayoutConfig().isTablet ? 400 : 346),
  },
  prefRowBase: {
    height: fh(getLayoutConfig().isTablet ? 56 : 46),
    width: "100%",
    borderRadius: fr(6),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 16 : 12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prefTitle: { 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  chev: { 
    color: Colors.textcolor, 
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18) 
  },
  dropdownPanel: {
    position: "absolute",
    top: fh(getLayoutConfig().isTablet ? 60 : 50),
    left: 0,
    right: 0,
    borderRadius: fr(8),
    elevation: 10,
    maxHeight: fh(getLayoutConfig().isTablet ? 250 : 220),
    zIndex: 100,
  },
  dropdownScroll: { flexGrow: 0 },
  dropdownItem: {
    paddingVertical: fh(getLayoutConfig().isTablet ? 16 : 12),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 16 : 12),
  },
  dropdownText: { 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  langButton: {
    paddingVertical: fh(getLayoutConfig().isTablet ? 12 : 8),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 24 : 20),
    marginHorizontal: fw(getLayoutConfig().isTablet ? 8 : 6),
    borderRadius: fr(20),
    backgroundColor: Colors.deepPurple,
    borderWidth: 1,
    borderColor: Colors.lavenderPurple,
  },

  langButtonActive: {
    backgroundColor: Colors.lavenderPurple, // active background
    borderColor: Colors.deepPurple,
  },

  langButtonText: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    color: Colors.textcolor,
    includeFontPadding: false,
  },

  langButtonTextActive: {
    color: "#fff", // highlighted text
  },
});

// ✅ Styles for the Location Search Modal
const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: getLayoutConfig().contentPadding,
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.deepPurple,
    borderRadius: fr(12),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 10 : 6),
    marginVertical: fh(getLayoutConfig().isTablet ? 16 : 12),
    borderWidth: 1,
    borderColor: Colors.lavenderPurple,
  },
  searchInput: {
    flex: 1,
    height: fh(getLayoutConfig().isTablet ? 52 : 44),
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  loading: {
    marginVertical: fh(getLayoutConfig().isTablet ? 14 : 10),
  },
  resultsScroll: {
    flex: 1,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: fh(getLayoutConfig().isTablet ? 18 : 14),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 16 : 12),
    borderRadius: fr(10),
    marginBottom: fh(getLayoutConfig().isTablet ? 12 : 8),
    elevation: 2,
  },
  dropdownText: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    flexShrink: 1,
    includeFontPadding: false,
  },
  noResultsText: {
    textAlign: "center",
    paddingVertical: fh(getLayoutConfig().isTablet ? 24 : 20),
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
});

export default PostNewsScreen;