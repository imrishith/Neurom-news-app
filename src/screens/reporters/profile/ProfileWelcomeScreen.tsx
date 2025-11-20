import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Switch, // <--- We'll use this inside the list
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  Platform,
  SafeAreaView as RNSafeAreaView,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientScreen from '../../../components/GradientScreen';
import AppHeader from '../../../components/AppHeader';
import Colors from '../../../constants/colors';
import { fw, fh, ff, fr, getLayoutConfig } from '../../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateDevice } from '../../../api/device/deviceService';
import { useOnboarding } from '../../../context/OnboardingContext';
import Ionicons from "react-native-vector-icons/Ionicons";
import { reporterAuth, reporterProfile } from "../../../api/reporter/reporterApi";
import { ScrollView } from "react-native";
import { useCategoriesStore } from '../../../../utils/store'; 
import { publicLanguages } from '../../../api/publicapi/publicApi';
import RateAppModal from '../../../components/RateAppModal';
import { useContentTabs } from '../../../hooks/useContentTabs';
import LoginModal from '../../../components/LoginModal';
import ReporterLoginModal from "../ReporterLoginModal";


// --- CUSTOM DIMENSIONS & CONSTANTS (Assumed for brevity) ---
const { height: screenHeight } = Dimensions.get('window');
const HEADER_H = fh(56);
const AVATAR_SIZE = 40;
const BORDER_W = 2;





// --- BottomSheet Content Type for state ---
type BottomSheetType = null | "category" | "language" | "voice"| "theme";
const ProfileWelcomeScreen = ({ navigation }: any) => {
  // Use a simplified state for dropdowns/bottom sheets
  const [openBottomSheet, setOpenBottomSheet] = useState<BottomSheetType>(null);
  const { data, updateData, t, getFont } = useOnboarding();
  const { Colors, theme, setTheme, barStyle, finalTheme} = useTheme();
  const { tabs, activeTab, setActiveTab, selectedCategories, setSelectedCategories } = useContentTabs();
  const [isNotificationEnabled, setNotificationEnabled] = useState(true);
  const [isRateModalVisible, setRateModalVisible] = useState(false);
  const [loginVisibleUser, setLoginVisibleUser] = useState(false);
  const [reporterLoginVisible, setReporterLoginVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [themeDropdownVisible, setThemeDropdownVisible] = useState(false);




  const currentLangCode = data.language_code || "en";

  // 🔹 Local state for preferences
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);

  const [selectedLanguage, setSelectedLanguage] = useState(t("select_language"));
  const [selectedVoice, setSelectedVoice] = useState(t("select_voice"));
  const [languages, setLanguages] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([]);
  const [tempSelectedLanguage, setTempSelectedLanguage] = useState(selectedLanguage);
  const [tempSelectedVoice, setTempSelectedVoice] = useState(selectedVoice);
  const [tempSelectedTheme, setTempSelectedTheme] = useState(theme);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const VOICE_OPTIONS =
    data.language_code === "te" ? ["పురుషుడు", "స్త్రీ"] : ["male", "female"];

  const CATEGORY_PLACEHOLDER = 'Categories';
  const CATEGORY_OPTIONS = []


  // 🔹 Login Modal state
  const [isLoginVisible, setLoginVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);


 useEffect(() => {
  console.log("📌 Screen-level BackHandler MOUNTED on ProfileWelcomeScreen");

  const backAction = () => {
    console.log("⬅️ Screen-level BackHandler fired on ProfileWelcomeScreen");
    navigation.navigate("HomeScreen");
    return true;
  };

  const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
  return () => {
    console.log("🧹 Screen-level BackHandler REMOVED from ProfileWelcomeScreen");
    sub.remove();
  };
}, []);


  

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoadingLanguages(true);
        const res = await publicLanguages.list(); // ✅ correct call
        if (res.success && Array.isArray(res.data?.items)) {
          setLanguages(res.data.items);
        }
      } catch (err) {
        console.error("❌ Language fetch error:", err);
      } finally {
        setLoadingLanguages(false);
      }
    };
    fetchLanguages();
  }, []);

  // --- Utility functions for data mapping ---
  const mapLanguageIdToText = (id: number) => {
    const lang = languages.find((l: any) => l.language_id === id);
    return lang ? lang.name : t("select_language");
  };

const mapLanguageTextToId = (text: string) => {
  const normalizedText = text
  const lang = languages.find(
    (l: any) =>
      l.name === normalizedText||
      (normalizedText === "తెలుగు" && l.code === "te") ||
      (normalizedText === "English" && l.code === "en")
  );
  return lang ? lang.language_id : null;
};


  useEffect(() => {
  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  };
  checkLogin();

  // recheck whenever screen is focused
  const unsubscribe = navigation.addListener("focus", checkLogin);
  return unsubscribe;
}, [navigation]);

  const mapVoiceValueToText = (value: string) => value.toLowerCase(); // "Male" -> "male"
  const mapVoiceTextToValue = (text: string) => {
  if (text === "పురుషుడు") return "Male";
  if (text === "స్త్రీ") return "Female";
  if (text.toLowerCase() === "male" || text.toLowerCase() === "female")
    return text.charAt(0).toUpperCase() + text.slice(1);
  return "Male"; // default fallback
};

  const { categories, fetchCategories, lastFetchedCategoriesAt } = useCategoriesStore();
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const TEN_MIN = 1000 * 60 * 10;
    const shouldRefetch =
      !lastFetchedCategoriesAt ||
      Date.now() - lastFetchedCategoriesAt > TEN_MIN ||
      categories.length === 0;

    if (shouldRefetch) {
      setLoadingCategories(true);
      fetchCategories().finally(() => setLoadingCategories(false));
    }
  }, [data.language_id]);

  useEffect(() => {
    if (data.language_id) {
      const langText = mapLanguageIdToText(data.language_id);
      setSelectedLanguage(langText);
    }
  }, [data.language_id, languages]);

  // 1. Initial State Sync
  useEffect(() => {
    if (data.language_id) {
      setSelectedLanguage(mapLanguageIdToText(data.language_id));
    } else {
      setSelectedLanguage(t("select_language"));
    }
    if (data.voice) {
      setSelectedVoice(mapVoiceValueToText(data.voice));
    } else {
      setSelectedVoice(t("select_voice"));
    }
  }, [data.language_id, data.voice, t]);

  // 2. Auth Check (Kept as is)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
         
          return;
        }

        const json = await reporterProfile.get();

        if (json.success) {
         
          await AsyncStorage.setItem("reporterProfile", JSON.stringify(json.data));
        } else {
          
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("reporterProfile");
        }
      } catch (err: any) {
        console.error("Auth check error:", err);
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("reporterProfile");
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (openBottomSheet === "category") setTempSelectedCategories([...selectedCategories]);
    if (openBottomSheet === "language") {
  const currentLang = languages.find(
    (l: any) => l.language_id === data.language_id
  );
  if (currentLangCode === "te") {
    if (currentLang?.code === "te") setTempSelectedLanguage("తెలుగు");
    else if (currentLang?.code === "en") setTempSelectedLanguage("ఆంగ్లం");
    else setTempSelectedLanguage(currentLang?.name || "");
  } else {
    setTempSelectedLanguage(currentLang?.name || "");
  }
}

    if (openBottomSheet === "voice") {
  if (data.language_code === "te") {
    // match Telugu display
    setTempSelectedVoice(data.voice === "Male" ? "పురుషుడు" : "స్త్రీ");
  } else {
    // match English display
    setTempSelectedVoice(data.voice?.toLowerCase() === "female" ? "female" : "male");
  }
}

 if (openBottomSheet === "theme") {
    setTempSelectedTheme(theme);
  }
  }, [openBottomSheet]);


  // 3. API Handlers (Kept as is)
  const requestOtp = async () => {
    try {
      setLoading(true);
      const json = await reporterAuth.requestOtp(phoneNumber.trim());
      setLoading(false);

      if (json.success) {
        setOtpSent(true);
        Alert.alert(json.data.message);
      } else {
        Alert.alert(json.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setLoading(false);
      console.error("❌ Request OTP error:", err);
      Alert.alert(err.message || "Something went wrong");
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      const json = await reporterAuth.verifyOtp(phoneNumber.trim(), otp.trim());
      setLoading(false);

      if (json.success) {
        const token = json.data.tokens.accessToken;
        const reporter = json.data.reporter;

        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("reporterProfile", JSON.stringify(reporter));

           setIsLoggedIn(true);

        setLoginVisibleUser(false);
        navigation.replace("ReporterDashboardScreen");
      } else {
        Alert.alert("Invalid OTP ❌. Please enter 123456 (test mode).");
      }
    } catch (err: any) {
      setLoading(false);
      console.error("❌ Verify OTP error:", err);
      Alert.alert(err.message || "Something went wrong");
    }
  };


  // 4. Data for the Preference Rows and Bottom Sheet
  const getPreferenceData = (key: BottomSheetType) => {
    switch (key) {
      case "category":
        return {
          options:
            categories.length > 0
              ? categories.map((c: any) => c.name_en || c.name_te)
              : CATEGORY_OPTIONS,
          selected: selectedCategory, // now an array
          titleKey:
            selectedCategory.length === 0
              ? "categories"
              : selectedCategory.join(", "), // show comma-separated names
          icon: require("../../../../assets/icons/catopt.png"),
          placeholder: t("select_category"),
          setter: setSelectedCategory,
        };


      case "language":
        return {
          options:
            languages.length > 0
              ? languages.map((l: any) => {
                  if (currentLangCode === "te") {
                    if (l.code === "te") return "తెలుగు";
                    if (l.code === "en") return "English";
                    return l.name; // fallback to backend name
                  }
                  return l.name; // non-Telugu mode → normal name
                })
              : currentLangCode === "te"
              ? ["తెలుగు", "English"]
              : ["Telugu", "English"],
          selected: selectedLanguage,
          titleKey:
            selectedLanguage === t("select_language")
              ? "language"
              : selectedLanguage,
          icon: require("../../../../assets/icons/language.png"),
          placeholder: t("select_language"),
          setter: setSelectedLanguage,
        };
      ;
      case 'voice':
        return {
          options: VOICE_OPTIONS,
          selected: selectedVoice,
          titleKey: selectedVoice === t("select_voice") ? "voice" : selectedVoice,
          icon: require('../../../../assets/icons/voice.png'),
          placeholder: t("select_voice"),
          setter: setSelectedVoice,
        };

      case "theme":
        return {
          options: [
            { label: "Light", icon: "sunny-outline" },
            { label: "Dark", icon: "moon-outline" },
            { label: "System", icon: "contrast-outline" },
          ],
          selected: theme,
          titleKey: "Theme",
          icon: null,
          placeholder: "Theme",
          setter: setTheme,
        };

      default:
        return { options: [], selected: '', titleKey: '', icon: 0, placeholder: '', setter: () => { } };
    }
  };

  // 5. Selection Handler with API Update Logic
  const handleSelection = async (key: BottomSheetType, item: string) => {
    const { setter, selected } = getPreferenceData(key);

    if (key === "category") {
      const categoryId = String(item.category_id || item);

      // ✅ toggle globally
      if (selectedCategories.includes(categoryId)) {
        setSelectedCategories(
          selectedCategories.filter((id) => id !== categoryId)
        );
      } else {
        setSelectedCategories([...selectedCategories, categoryId]);
      }

      return; // don’t close modal
    }
    // For single-select (language/voice)
    if (selected === item) return;

    setter(item);

    try {
      if (key === "language") {
        const langId = mapLanguageTextToId(item);
        await updateDevice({ device_id: data.device_id!, language_id: langId });
        const selectedLang = languages.find((l: any) => l.language_id === langId);
        const langCode = selectedLang?.code || "en";
        updateData({ language_id: langId, language_code: langCode });
      } else if (key === "voice") {
        const voiceValue = mapVoiceTextToValue(item);
        await updateDevice({ device_id: data.device_id!, voice: voiceValue });
        updateData({ voice: voiceValue });
      }
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      Alert.alert("Update Failed", `Could not update ${key} preference.`);
    }
  };


  // 6. Bottom Sheet Content Renderer
  const renderBottomSheetContent = (
    options: string[],
    selected: string | string[],
    key: BottomSheetType
  ) => (
    <RNSafeAreaView style={{ flex: 1 }}>
      <Text
        style={[
          styles.bottomSheetTitle,
          { fontFamily: getFont("bold"), color: Colors.textcolor },
        ]}
      >
       {t(
          key === "category"
            ? "select_category"
            : key === "language"
            ? "select_language"
            : key === "voice"
            ? "select_voice"
            : "select_voice"
        )}

      </Text>

      {/* 🔹 Category loader */}
      {loadingCategories && key === "category" ? (

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.lavenderPurple} />
          <Text
            style={{
              color: "#fff",
              marginTop: fh(10),
              fontFamily: getFont("regular"),
            }}
          >
            {t("loading_categories")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={key === "category" ? categories : options}

          keyExtractor={(item, index) =>
            key === "category"
              ? String(item.category_id)
              : String(item) || String(index)
          }

          renderItem={({ item }) => {
            const isCategory = key === "category";

            const isSelected = isCategory
              ? tempSelectedCategories.includes(String(item.category_id))
              : key === "language"
                ? tempSelectedLanguage === item
                : tempSelectedVoice === item;

            return (
              <TouchableOpacity
                style={[styles.bsItem, { borderBottomColor: Colors.borderColor }]}
                activeOpacity={0.8}
                onPress={() => {
                  if (key === "category") {
                    const id = String(item.category_id);
                    setTempSelectedCategories(prev =>
                      prev.includes(id)
                        ? prev.filter(i => i !== id)
                        : [...prev, id]
                    );
                  } else if (key === "language") {
                    setTempSelectedLanguage(item);
                  } else if (key === "voice") {
                    setTempSelectedVoice(item);
                  }
                }}
              >
                <View style={{ flex: 1, marginRight: fw(10) }}>
                  <Text
                    style={[styles.bsText, { color: Colors.textcolor }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {isCategory
                      ? currentLangCode === "te"
                        ? item.display_name_te || item.name_te
                        : item.display_name_en || item.name_en
                      : item}

                  </Text>
                </View>

                <Switch
                  value={isSelected}
                  trackColor={{
                    false: Colors.mediumGray,
                    true: Colors.lavenderPurple,
                  }}
                  thumbColor={Colors.textcolor}
                  onValueChange={() => {
                    if (key === "category") {
                      const id = String(item.category_id);
                      setTempSelectedCategories(prev =>
                        prev.includes(id)
                          ? prev.filter(i => i !== id)
                          : [...prev, id]
                      );
                    } else if (key === "language") {
                      setTempSelectedLanguage(item);
                    } else if (key === "voice") {
                      setTempSelectedVoice(item);
                    }
                  }}
                />
              </TouchableOpacity>
            );
          }}

        />

      )}

      {/* ✅ Universal “Done” button for all sheets */}
      {key !== "theme" && (
      <TouchableOpacity
        style={{
          backgroundColor: Colors.lavenderPurple,
          marginHorizontal: fw(16),
          marginVertical: fh(10),
          borderRadius: 10,
          paddingVertical: fh(12),
          alignItems: "center",
        }}
        onPress={async () => {
          try {
            if (key === "category") {
              updateData({ categories: tempSelectedCategories });
              setSelectedCategories(tempSelectedCategories);
            } else if (key === "language") {
              const langId = mapLanguageTextToId(tempSelectedLanguage);
              const selectedLang = languages.find((l: any) => l.language_id === langId);
              const langCode = selectedLang?.code || "en";

              await updateDevice({
                device_id: data.device_id!,
                language_id: langId,
              });

              updateData({ language_id: langId, language_code: langCode });
              setSelectedLanguage(tempSelectedLanguage);

              // 🔁 refetch categories in the new language
              await fetchCategories();
            } else if (key === "voice") {
              const voiceValue = mapVoiceTextToValue(tempSelectedVoice);
              await updateDevice({
                device_id: data.device_id!,
                voice: voiceValue,
              });
              updateData({ voice: voiceValue });
              setSelectedVoice(tempSelectedVoice);
            }

            setOpenBottomSheet(null); // ✅ Close bottom sheet
          } catch (err) {
            console.error(`❌ Failed to update ${key}:`, err);
            Alert.alert("Update Failed", `Could not update ${key} preference.`);
          }
        }}

      >
        <Text
          style={{
            color: "#fff",
            fontFamily: getFont("bold"),
            fontSize: ff(15),
          }}
        >
          {t("Done")}
        </Text>
      </TouchableOpacity>
      )}
    </RNSafeAreaView>
  );



  const activeData = useMemo(() => getPreferenceData(openBottomSheet), [openBottomSheet, selectedCategory, selectedLanguage, selectedVoice, t]);


  return (

    <GradientScreen>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>

        <StatusBar translucent backgroundColor="transparent" barStyle={barStyle} />

        {/* AppHeader (Kept as is) */}
        <AppHeader
          backgroundColor="transparent"
          showBottomDivider={false}
          safeTopPadding={false}
          containerStyle={{
            minHeight: HEADER_H,
            paddingVertical: fh(6),
            paddingHorizontal: fw(8),
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          }}
          leftComponents={[
            <Image
              key="back"
              source={require('../../../../assets/icons/backarrow.png')}
              style={styles.icon24}
              resizeMode="contain"
            />,
          ]}
          rightComponents={[
            <View key="settingsWrap" style={{ paddingVertical: fh(4) }}>
              <Ionicons name="settings-outline" size={fw(20)} color={Colors.lavenderPurple} />
            </View>,
          ]}
          centerComponent={
            <Image
              source={require('../../../../assets/images/logo.png')}
              style={styles.centerTitle}
              resizeMode="contain"
            />
          }
          onLeftPress={() => navigation.goBack?.()}
          onRightPress={() => navigation.navigate?.('SettingsScreen')}
        />

        {/* ScrollView wraps everything below the header */}

        {/* Profile row */}
        <View style={styles.profileRow}>
          {/* Avatar and Welcome/Login */}
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Ionicons
                name="person-outline"   // or "person" for filled version
                size={fw(18)}           // responsive size (adjust if needed)
                color="#fff"            // icon color
                style={{ alignSelf: 'center', marginTop: fh(8) }}
              />
            </View>
          </View>

          <View style={styles.welcomeWrap}>
            <Text style={[styles.welcomeText, { color: Colors.textcolor, fontFamily: getFont("regular") }]}>
              {t("hi_guest")}
            </Text>
           <TouchableOpacity onPress={() => setLoginVisibleUser(true)}>
  <Text
    style={[
      styles.loginLink,
      { color: Colors.textcolor, fontFamily: getFont("regular") },
    ]}
  >
    {t("click_login")}
  </Text>
</TouchableOpacity>

          </View>

          {/* Dark Mode Toggle */}
         <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: Colors.textcolor }]}>
              {t("dark_mode")}
            </Text>

            <Switch
              value={theme === "dark"}
              onValueChange={(val) => setTheme(val ? "dark" : "light")}
              trackColor={{ false: "#5B5B68", true: "#7D67D9" }}
              thumbColor={finalTheme === "dark" ? Colors.textcolor : "#E5E5EA"}
            />
          </View>



        </View>

        {/* CTA (Become a Reporter) */}
        <TouchableOpacity activeOpacity={0.9} style={{ marginTop: fh(16) }} onPress={async () => {
          const token = await AsyncStorage.getItem("authToken");
          if (token) {
            navigation.navigate("ReporterDashboardScreen");
          } else {
            setReporterLoginVisible(true);
          }
        }}>
          <LinearGradient
            useAngle
            angle={200}
            angleCenter={{ x: 0.5, y: 0.8 }}
            colors={['#997DDF', '#7741FF']}
            locations={[0.25, 0.93]}
            style={styles.ctaBtn}
          >
            <View style={styles.ctaContent}>

             <Text
              style={[
                styles.ctaText,
                { color: "#FFFFFF", fontFamily: getFont("semiBold") },
              ]}
            >
              {isLoggedIn ? t("reporter") : t("become_reporter")}
            </Text>
              <Image
                source={require('../../../../assets/icons/pluser.png')}
                style={styles.ctaRightIcon}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ✅ ADD THIS SPACER BELOW THE BUTTON */}
        <View style={{ height: fh(20) }} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: fh(40) }}
          showsVerticalScrollIndicator={false}
        >


          {/* Your Content */}
          <Text style={[styles.sectionHeading, { color: Colors.textcolor, fontFamily: getFont("semiBold") }]}>
            {t("your_content")}
          </Text>
          <View style={styles.cardList}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.contentCard, { backgroundColor: Colors.deepPurple }]}
              onPress={() => navigation.navigate?.('NotificationsScreen')}
            >
              <View style={styles.cardIconWrap}>
                <Image
                  source={require('../../../../assets/icons/inbox.png')}
                  style={styles.cardIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.cardTitle, { color: Colors.textcolor, fontFamily: getFont("regular") }]}>
                {t("notification_inbox")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.contentCard, { backgroundColor: Colors.deepPurple }]}
              onPress={() => navigation.navigate('SavedArticlesScreen')}
            >
              <View style={styles.cardIconWrap}>
                <Image
                  source={require('../../../../assets/icons/savein.png')}
                  style={styles.cardIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.cardTitle, { color: Colors.textcolor, fontFamily: getFont("regular") }]}>
                {t("saved_articles")}
              </Text>
            </TouchableOpacity>
          </View>



          {/* Your Preference */}
          <Text style={[styles.sectionHeading, { color: Colors.textcolor, fontFamily: getFont("semiBold") }]}>
            {t("your_preference")}
          </Text>

          <View style={styles.prefList}>
          
            {/* Preference Rows using Bottom Sheet opener */}
            {["category", "language", "voice"].map((key) => {
              const { titleKey, icon, placeholder, selected } = getPreferenceData(key as BottomSheetType);
              // const displayTitle = selected && selected !== placeholder ? t(selected) : t(titleKey);
              const displayTitle = placeholder;

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.9}
                  style={[styles.prefRowBase, { backgroundColor: Colors.deepPurple }]}
                  onPress={() => setOpenBottomSheet(key as BottomSheetType)}
                >
                  <View style={styles.rowLeft}>
                    <Image source={icon} style={[styles.prefIcon, { tintColor: Colors.mediumGray }]} resizeMode="contain" />
                    <Text style={[styles.prefTitle, { color: Colors.textcolor, fontFamily: getFont("regular") }]}>
                      {displayTitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={fw(20)} color={Colors.mediumGray} />
                </TouchableOpacity>
              );
            })}

            {/* Location */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.prefRowBase, { backgroundColor: Colors.deepPurple }]}
              onPress={() => navigation.navigate("LocationScreen", { fromProfile: true })}
            >
              <View style={styles.rowLeft}>
                <Image
                  source={require('../../../../assets/icons/location-detect.png')}
                  style={[styles.prefIcon, { tintColor: Colors.mediumGray }]}
                  resizeMode="contain"
                />
                <Text
                  style={[styles.prefTitle, { color: Colors.textcolor, fontFamily: getFont("regular") }]}
                >
                  {data.village_name
                    ? `${data.village_name}`
                    : t("select_location")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={fw(20)} color={Colors.mediumGray} />
            </TouchableOpacity>

            {/* Notification */}
            {/* Notification with Toggle */}
            <View
              style={[styles.prefRowBase, { backgroundColor: Colors.deepPurple }]}
            >
              <View style={styles.rowLeft}>
                <Image
                  source={require('../../../../assets/icons/bell.png')}
                  style={[styles.prefIcon, { tintColor: Colors.mediumGray }]}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.prefTitle,
                    { color: Colors.textcolor, fontFamily: getFont("regular") },
                  ]}
                >
                  {t("notification")}
                </Text>
              </View>

               <View pointerEvents="none">
                 <Switch
                   value={isNotificationEnabled}
                    onValueChange={setNotificationEnabled}
                   trackColor={{ false: '#5B5B68', true: '#7D67D9' }}
                   thumbColor={theme === 'dark' ? Colors.textcolor : '#E5E5EA'}
                 />
               </View>


            </View>

          </View>


          {/* Refer button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { }}
            style={{ marginTop: fh(32), marginBottom: fh(24) }}
          >
            <LinearGradient
              useAngle
              angle={200}
              angleCenter={{ x: 0.5, y: 0.8 }}
              colors={['#997DDF', '#7741FF']}
              locations={[0.25, 0.93]}
              style={styles.referBtn}
            >
              <View style={styles.referContent}>
                <Text style={[styles.referText, { color: "#FFF", fontFamily: getFont("bold") }]}>
                  {t("refer_app")}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>


          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setRateModalVisible(true)}
            style={{ marginTop: fh(20), marginBottom: fh(16) }}
          >
            <LinearGradient
              useAngle
              angle={200}
              angleCenter={{ x: 0.5, y: 0.8 }}
              colors={["#997DDF", "#7741FF"]}
              locations={[0.25, 0.93]}
              style={styles.rateBtn}
            >
              <View style={styles.referContent}>
                <Text
                  style={[
                    styles.referText,
                    { color: "#FFF", fontFamily: getFont("bold") },
                  ]}
                >
                  {t("rate_this_app")}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>


        </ScrollView>

        {/* End of ScrollView */}


        {/* --- Bottom Sheet Modal for Preferences --- */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={openBottomSheet !== null}
          onRequestClose={() => setOpenBottomSheet(null)}
        >
          <TouchableWithoutFeedback onPress={() => setOpenBottomSheet(null)}>
            <View style={styles.bottomSheetOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.bottomSheetContainer, { backgroundColor: Colors.deepPurple }]}>
                  {openBottomSheet && renderBottomSheetContent(activeData.options, activeData.selected, openBottomSheet)}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>


        {/* Login Modal (Kept as is) */}
        <Modal visible={isLoginVisible} transparent animationType="slide" onRequestClose={() => setLoginVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setLoginVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.modalBox,
                    {
                      backgroundColor: Colors.deepPurple,
                      height: otpSent ? fh(250) : fh(200),  // 👈 dynamic height based on state
                    },
                  ]}
                >
                  <Text style={[styles.modalHeading, { color: Colors.textcolor, fontFamily: getFont("bold") }]}>
                    {t("login_Neurom")}
                  </Text>

                  {/* Phone Input */}
                  <TextInput
                    style={[styles.input, { borderColor: Colors.lavenderPurple, color: Colors.textcolor }]}
                    placeholder="Enter Phone Number (+91...)"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />

                  {otpSent && (
                    <TextInput
                      style={[styles.input, { borderColor: Colors.lavenderPurple, color: Colors.textcolor }]}
                      placeholder="Enter OTP"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={setOtp}
                    />
                  )}

                  {/* Action Buttons */}
                  {loading ? (
                    <ActivityIndicator size="large" color={Colors.lavenderPurple} style={{ marginTop: fh(12) }} />
                  ) : !otpSent ? (
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Colors.lavenderPurple }]} onPress={requestOtp}>
                      <Text style={[styles.submitText, { fontFamily: getFont("bold") }]}>{t("send_otp")}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Colors.lavenderPurple }]} onPress={verifyOtp}>
                      <Text style={[styles.submitText, { fontFamily: getFont("bold") }]}>{t("verify_otp")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Reporter Login Modal */}
        <ReporterLoginModal
          visible={reporterLoginVisible}
          onClose={() => setReporterLoginVisible(false)}
          onSuccess={({ token, reporter }) => {
            setIsLoggedIn(true);
            setReporterLoginVisible(false);
            navigation.replace("ReporterDashboardScreen");
          }}
        />

        <RateAppModal
          visible={isRateModalVisible}
          onClose={() => setRateModalVisible(false)}
        />

       <LoginModal
  visible={loginVisibleUser}
  onClose={() => setLoginVisibleUser(false)}
  onLoginSuccess={(u) => {
    setUser(u);                 // ✅ store user in state
    setLoginVisibleUser(false);     // ✅ close modal
  }}
/>



      </SafeAreaView>

    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  centerTitle: { 
    width: fw(getLayoutConfig().isTablet ? 84 : 72), 
    height: fh(getLayoutConfig().isTablet ? 24 : 20), 
    marginRight: fw(getLayoutConfig().isTablet ? 14 : 10), 
    tintColor: Colors.lavenderPurple 
  },
  icon24: { 
    width: fw(getLayoutConfig().isTablet ? 28 : 24), 
    height: fw(getLayoutConfig().isTablet ? 28 : 24), 
    marginLeft: fw(getLayoutConfig().isTablet ? 12 : 8) 
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: getLayoutConfig().contentPadding,
    marginTop: fh(getLayoutConfig().isTablet ? 16 : 10),
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: BORDER_W,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: fh(0)
  },
  avatarInner: {
    width: AVATAR_SIZE - BORDER_W * 3,
    height: AVATAR_SIZE - BORDER_W * 3,
    borderRadius: (AVATAR_SIZE - BORDER_W * 2) / 2,
    overflow: 'hidden',
    backgroundColor: '#4B3A69',
  },
  avatarImage: { width: '100%', height: '100%' },
  welcomeWrap: { flex: 1, marginLeft: fw(getLayoutConfig().isTablet ? 16 : 12) },
  welcomeText: {
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16),
    fontWeight: '400',
    marginBottom: 0,
    includeFontPadding: false,
  },
  loginLink: {
    marginTop: fh(getLayoutConfig().isTablet ? 6 : 4),
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12),
    textDecorationLine: 'underline',
    fontWeight: '800',
    includeFontPadding: false,
  },
  toggleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: fw(getLayoutConfig().isTablet ? 12 : 8), 
    marginTop: fh(getLayoutConfig().isTablet ? 8 : 5), 
    bottom: fh(getLayoutConfig().isTablet ? 10 : 14) 
  },
  toggleLabel: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    fontWeight: '400',
    includeFontPadding: false,
  },
  ctaBtn: {
    marginHorizontal: getLayoutConfig().contentPadding,
    height: fh(getLayoutConfig().isTablet ? 56 : 48),
    borderRadius: fr(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: fh(getLayoutConfig().isTablet ? 20 : 15),
  },
  ctaContent: {
    width: '100%',
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 18 : 14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaLeftIcon: { width: fw(getLayoutConfig().isTablet ? 60 : 50), height: fw(getLayoutConfig().isTablet ? 60 : 50) },
  ctaRightIcon: { 
    width: fw(getLayoutConfig().isTablet ? 24 : 20), 
    height: fw(getLayoutConfig().isTablet ? 24 : 20), 
    tintColor: 'white', 
    marginRight: fw(getLayoutConfig().isTablet ? 12 : 8) 
  },
  ctaText: {
    flex: 1,
    textAlign: 'left',
    color: 'white',
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16),
    fontWeight: '700',
    marginLeft: fw(getLayoutConfig().isTablet ? 12 : 8),
    includeFontPadding: false,
  },
  sectionHeading: {
    marginHorizontal: getLayoutConfig().contentPadding,
    marginBottom: fh(getLayoutConfig().isTablet ? 30 : 24),
    marginTop: fh(getLayoutConfig().isTablet ? 30 : 24),
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    lineHeight: ff(getLayoutConfig().isTablet ? 24 : 22),
    fontWeight: '600',
    includeFontPadding: false,
  },
  cardList: {
    marginHorizontal: getLayoutConfig().contentPadding,
    gap: fh(getLayoutConfig().isTablet ? 24 : 20),
  },
  contentCard: {
    height: fh(getLayoutConfig().isTablet ? 56 : 48),
    width: '100%',
    borderRadius: fr(10),
    paddingVertical: fh(getLayoutConfig().isTablet ? 18 : 14),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 10 : 6),
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconWrap: {
    width: fw(getLayoutConfig().isTablet ? 32 : 28),
    height: fw(getLayoutConfig().isTablet ? 32 : 28),
    borderRadius: fr(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: fw(getLayoutConfig().isTablet ? 14 : 10),
  },
  cardIcon: { 
    width: fw(getLayoutConfig().isTablet ? 22 : 18), 
    height: fw(getLayoutConfig().isTablet ? 22 : 18), 
  },
  cardTitle: {
    flex: 1,
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  prefList: {
    marginHorizontal: getLayoutConfig().contentPadding,
    marginTop: fh(getLayoutConfig().isTablet ? 16 : 10),
    gap: fh(getLayoutConfig().isTablet ? 24 : 20),
  },
  prefRowBase: {
    height: fh(getLayoutConfig().isTablet ? 56 : 49),
    width: '100%',
    borderRadius: fr(6),
    paddingVertical: fh(getLayoutConfig().isTablet ? 18 : 14),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 16 : 12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  prefIcon: { 
    width: fw(getLayoutConfig().isTablet ? 24 : 21), 
    height: fw(getLayoutConfig().isTablet ? 24 : 21), 
    marginRight: fw(getLayoutConfig().isTablet ? 14 : 10) 
  },
  prefTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  referBtn: {
    marginHorizontal: getLayoutConfig().contentPadding,
    height: fh(getLayoutConfig().isTablet ? 56 : 48),
    borderRadius: fr(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: fh(getLayoutConfig().isTablet ? 20 : 15),
  },
  referContent: {
    width: '100%',
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 18 : 14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referText: {
    flex: 1,
    textAlign: 'left',
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16),
    fontWeight: '700',
    paddingVertical: fh(getLayoutConfig().isTablet ? 14 : 10),
    includeFontPadding: false,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalBox: { 
    width: fw(getLayoutConfig().isTablet ? 360 : 300), 
    borderRadius: fr(12), 
    padding: fw(getLayoutConfig().isTablet ? 24 : 20), 
    height: fh(getLayoutConfig().isTablet ? 280 : 250), 
    top: fh(getLayoutConfig().isTablet ? 280 : 300) 
  },
  modalHeading: { 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14), 
    marginBottom: fh(getLayoutConfig().isTablet ? 20 : 16), 
    textAlign: 'center',
    includeFontPadding: false,
  },
  input: {
    borderWidth: 1,
    borderRadius: fr(8),
    paddingVertical: fh(getLayoutConfig().isTablet ? 8 : 2),
    paddingLeft: fw(getLayoutConfig().isTablet ? 18 : 15),
    paddingRight: fw(getLayoutConfig().isTablet ? 12 : 8),
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 12),
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
  },
  submitBtn: { 
    borderRadius: fr(8), 
    paddingVertical: fh(getLayoutConfig().isTablet ? 18 : 15), 
    alignItems: 'center', 
    marginTop: fh(getLayoutConfig().isTablet ? 12 : 8) 
  },
  submitText: { 
    color: '#fff', 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    bottom: fh(getLayoutConfig().isTablet ? 0 : 2), 
    right: fw(getLayoutConfig().isTablet ? 0 : 2),
    includeFontPadding: false,
  },

  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    width: '100%',
    height: "50%",
    borderTopLeftRadius: fr(20),
    borderTopRightRadius: fr(20),
    paddingHorizontal: getLayoutConfig().contentPadding,
    paddingTop: fh(getLayoutConfig().isTablet ? 14 : 10),
    paddingBottom: fh(20),
  },
  bottomSheetTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
    textAlign: 'center',
    paddingVertical: fh(getLayoutConfig().isTablet ? 14 : 10),
    marginBottom: fh(getLayoutConfig().isTablet ? 14 : 10),
    color: '#FFF',
    includeFontPadding: false,
  },
  bsListContent: {
    paddingBottom: fh(getLayoutConfig().isTablet ? 24 : 20),
  },
  bsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: fh(getLayoutConfig().isTablet ? 18 : 15),
    justifyContent: 'flex-start',
  },
  bsText: {
    fontSize: ff(16),
    lineHeight: ff(22),
  },

  rateBtn: {
    marginHorizontal: fw(16),
    height: fh(48),
    borderRadius: fw(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: fh(-30),

  },
});

export default ProfileWelcomeScreen;
