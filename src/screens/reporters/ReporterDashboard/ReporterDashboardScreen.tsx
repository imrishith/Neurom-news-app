// screens/ReporterDashboardScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  BackHandler
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../context/ThemeContext";
import GradientScreen from "../../../components/BackgoundGradient";
import AppHeader from "../../../components/AppHeader";
import SidebarPanel from "../SidebarPanel/SidebarPanel";
import { fw, fh, ff, fr, getLayoutConfig } from "../../../../utils/responsive";
import Colors from "../../../constants/colors";
import { useOnboarding } from "../../../context/OnboardingContext";
import { reporterProfile, reporterEarnings } from "../../../api/reporter/reporterApi";
import { launchImageLibrary } from "react-native-image-picker";
const HEADER_H = fh(56);
const AVATAR_SIZE = fw(44);
const AVATAR_BORDER = 1;

const ReporterDashboardScreen = ({ navigation }: any) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { Colors, barStyle } = useTheme();
  const { t, getFont } = useOnboarding();

  useEffect(() => {
    const backAction = () => {
      navigation.navigate("ProfileWelcomeScreen");   // 👈 ALWAYS go to Home
      return true; // prevent default exit behavior
    };
  
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
  
    return () => backHandler.remove();
  }, []);
  

  // 🔹 Logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("reporterProfile");
    navigation.reset({ index: 0, routes: [{ name: "ProfileWelcomeScreen" }] });
  };


  // 🔹 Fetch reporter profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // 1. Load cached profile first
        const cached = await AsyncStorage.getItem("reporterProfile");
        if (cached) setProfile(JSON.parse(cached));

        // 2. Then fetch latest from API
        const json = await reporterProfile.get();
        if (json.success) {
          setProfile(json.data);
          await AsyncStorage.setItem("reporterProfile", JSON.stringify(json.data));
        }
      } catch (err) {
        console.error("❌ Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);



  // 🔹 Fetch earnings
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const json = await reporterEarnings.getStats();
        if (json.success) setEarnings(json.data);
      } catch (err) {
        console.error("❌ Earnings fetch error:", err);
      }
    };
    fetchEarnings();
  }, []);

  return (
    <GradientScreen>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1 }}
      >

        <StatusBar translucent backgroundColor="transparent" barStyle={barStyle} />

        {/* Header */}
        <AppHeader
          backgroundColor="transparent"
          showBottomDivider={false}
          safeTopPadding={false}
          containerStyle={{
            height: HEADER_H,
            paddingHorizontal: fw(8),
            elevation: 0,
            shadowOpacity: 0,
          }}
          leftComponents={[
            <Image
              key="menu"
              source={require("../../../../assets/icons/bar.png")}
              style={{ width: fw(20), height: fw(20), marginLeft: fw(12) }}
            />,
          ]}
          rightComponents={[
            <Image
              key="home"
              source={require("../../../../assets/icons/Frame.png")}
              style={{ width: fw(26), height: fw(26) }}
            />,
          ]}
          onLeftPress={() => setSidebarVisible(true)}
          onRightPress={() => navigation.navigate?.("HomeScreen")}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.lavenderPurple}
            style={{ marginTop: fh(40) }}
          />
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: fh(80) }}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Block */}
            <View style={styles.profileWrap}>
              <View style={styles.avatarOuter}>
                <View style={styles.avatarInner}>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const result = await launchImageLibrary({
                          mediaType: "photo",
                          quality: 0.8,
                        });

                        if (result.didCancel) return;

                        const asset = result.assets?.[0];
                        if (!asset?.uri) return;

                        setLoading(true);

                        const fileUri = asset.uri;
                        const fileName = asset.fileName || "profile.jpg";
                        const mimeType = asset.type || "image/jpeg";

                        const response = await reporterProfile.uploadPhoto(fileUri, fileName, mimeType);

                        if (response.success) {
                          const updated = { ...profile, photo: response.data.photo };
                          setProfile(updated);
                          await AsyncStorage.setItem("reporterProfile", JSON.stringify(updated));
                          console.log("✅ Photo updated!");
                        } else {
                          console.log("❌ Upload failed:", response.message);
                        }
                      } catch (err) {
                        console.error("Upload error:", err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Image
                      source={
                        profile?.photo
                          ? { uri: profile.photo }
                          : require("../../../../assets/images/profile.jpg")
                      }
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.hiText, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>
                  {t("hi")} {profile?.first_name || t("guest")} 👋
                </Text>
                <Text style={[styles.subline, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>
                  {t("reporter_for")}{" "}
                  <Text style={[styles.sublineStrong, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>
                    {profile?.district?.name || t("unknown_region")}
                  </Text>
                </Text>

                <TouchableOpacity>
                  <Text style={[styles.link, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>
                    {t("click_change")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cards */}
            <View style={styles.cardsColumn}>
              {/* Post short news */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: Colors.deepPurple }]}
                onPress={() => navigation.navigate("PostNewsScreen")}
              >
                <View style={styles.cardTextCol}>
                  <Text style={[styles.cardTitle, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>
                    {t("post_short_news")}
                  </Text>
                  <Text style={[styles.cardSubtitle, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>
                    {t("post_short_news_subtitle")}
                  </Text>
                  <TouchableOpacity>
                    <Text style={[styles.cardLink, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>
                      {t("add_news")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("../../../../assets/images/post.png")}
                  style={styles.cardArt}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Achievements */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: Colors.deepPurple }]}
                onPress={() => navigation.navigate("AchievementsScreen")}
              >
                <View style={styles.cardTextCol}>
                  <Text style={[styles.cardTitle, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>
                    {t("your_achievements")}
                  </Text>
                  <Text style={[styles.cardSubtitle, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>
                    {t("achievements_subtitle")}
                  </Text>
                  <Text style={[styles.badgeLine, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>
                    <Text style={[styles.badgeStrong, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>
                      {t("fast_starter_badge")}
                    </Text>
                  </Text>
                  <TouchableOpacity>
                    <Text style={[styles.cardLink, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>
                      {t("view_all")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("../../../../assets/images/achieve.png")}
                  style={styles.cardArt}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Payments */}
              <View style={[styles.card, { backgroundColor: Colors.deepPurple }]}>
                <View style={styles.cardTextCol}>
                  <Text style={[styles.cardTitle, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>
                    {t("your_payments")}
                  </Text>
                  <Text style={[styles.cardSubtitle, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>
                    {t("payments_subtitle")}
                  </Text>

                  {earnings ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                      <View
                        style={[
                          styles.kvRowBox,
                          { backgroundColor: Colors.deepPurple }, // dynamic
                        ]}
                      >
                        <Text style={[styles.kvLabel, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>{t("total_earnings")}</Text>
                        <Text style={[styles.kvValue, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>₹{earnings.total_earnings}</Text>
                      </View>
                      <View
                        style={[
                          styles.kvRowBox,
                          { backgroundColor: Colors.deepPurple }, // dynamic
                        ]}
                      >
                        <Text style={[styles.kvLabel, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>{t("articles_submitted")}</Text>
                        <Text style={[styles.kvValue, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>{earnings.articles_count}</Text>
                      </View>
                      <View
                        style={[
                          styles.kvRowBox,
                          { backgroundColor: Colors.deepPurple }, // dynamic
                        ]}
                      >
                        <Text style={[styles.kvLabel, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>{t("this_month")}</Text>
                        <Text style={[styles.kvValue, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>₹{earnings.this_month}</Text>
                      </View>
                      <View
                        style={[
                          styles.kvRowBox,
                          { backgroundColor: Colors.deepPurple }, // dynamic
                        ]}
                      >
                        <Text style={[styles.kvLabel, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>{t("last_month")}</Text>
                        <Text style={[styles.kvValue, { fontFamily: getFont("bold"), color: Colors.textcolor }]}>₹{earnings.last_month}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.kvLabel, { fontFamily: getFont("regular"), color: Colors.textcolor }]}>{t("fetching_earnings")}</Text>
                  )}

                  <TouchableOpacity activeOpacity={0.9}>
                    <LinearGradient
                      useAngle
                      angle={200}
                      angleCenter={{ x: 0.5, y: 0.8 }}
                      colors={["#997DDF", "#7741FF"]}
                      locations={[0.25, 0.93]}
                      style={styles.withdrawBtn}
                    >
                      <Text style={[styles.withdrawText, { fontFamily: getFont("regular") }]}>{t("withdraw")}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("../../../../assets/images/currency.png")}
                  style={styles.cardArt}
                  resizeMode="contain"
                />
              </View>
            </View>
          </ScrollView>
        )}

        {/* Sidebar */}
        <SidebarPanel
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          avatar={profile?.photo ? { uri: profile.photo } : require("../../../../assets/images/profile.jpg")}
          greeting={`${t("hi")} ${profile?.first_name || t("guest")}`}
          subtitle={`${t("reporter_for")} ${profile?.district?.name || t("unknown")}`}
          items={[
            { key: "home", label: t("home"), onPress: () => navigation.navigate("HomeScreen") },
            { key: "profile", label: t("profile"), onPress: () => navigation.navigate("ProfileScreen") },
            { key: "report", label: t("report"), onPress: () => navigation.navigate("ReporterDashboardScreen") },
            { key: "about", label: t("about"), onPress: () => navigation.navigate("AboutScreen") },
            { key: "question", label: t("question"), onPress: () => navigation.navigate("FAQScreen") },
            { key: "logout", label: t("logout"), onPress: handleLogout },
          ]}
          onPhotoUpdated={(newPhotoUrl) => {
            // Update profile state & AsyncStorage in parent
            const updated = { ...profile, photo: newPhotoUrl };
            setProfile(updated);
            AsyncStorage.setItem("reporterProfile", JSON.stringify(updated));
          }}
        />

      </SafeAreaView>
    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  profileWrap: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginHorizontal: getLayoutConfig().contentPadding, 
    marginTop: fh(getLayoutConfig().isTablet ? 20 : 15), 
    marginBottom: fh(getLayoutConfig().isTablet ? 12 : 8) 
  },
  avatarOuter: {
    width: AVATAR_SIZE + AVATAR_BORDER * 2,
    height: AVATAR_SIZE + AVATAR_BORDER * 2,
    borderRadius: (AVATAR_SIZE + AVATAR_BORDER * 2) / 2,
    borderWidth: AVATAR_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: fw(getLayoutConfig().isTablet ? 16 : 12),
  },
  avatarInner: { 
    width: AVATAR_SIZE, 
    height: AVATAR_SIZE, 
    borderRadius: AVATAR_SIZE / 2, 
    overflow: "hidden", 
    backgroundColor: "#4B3A69" 
  },
  hiText: { 
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16), 
    marginBottom: fh(getLayoutConfig().isTablet ? 6 : 4),
    includeFontPadding: false,
  },
  subline: { 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    color: Colors.textcolor, 
    marginTop: fh(getLayoutConfig().isTablet ? 4 : 2),
    includeFontPadding: false,
  },
  sublineStrong: { color: Colors.textcolor },
  link: { 
    marginTop: fh(getLayoutConfig().isTablet ? 8 : 6), 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    textDecorationLine: "underline", 
    color: Colors.textcolor,
    includeFontPadding: false,
  },
  cardsColumn: { 
    paddingHorizontal: getLayoutConfig().contentPadding, 
    gap: fh(getLayoutConfig().isTablet ? 36 : 30), 
    marginTop: fh(getLayoutConfig().isTablet ? 24 : 20) 
  },
  card: { 
    minHeight: fh(getLayoutConfig().isTablet ? 140 : 125), 
    borderRadius: fr(12), 
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 18 : 14), 
    paddingVertical: fh(getLayoutConfig().isTablet ? 20 : 16), 
    flexDirection: "row", 
    alignItems: "center" 
  },
  cardTextCol: { flex: 1, paddingRight: fw(getLayoutConfig().isTablet ? 12 : 8) },
  cardArt: { 
    width: fw(getLayoutConfig().isTablet ? 100 : 90), 
    height: fh(getLayoutConfig().isTablet ? 100 : 90) 
  },
  cardTitle: { 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14), 
    marginBottom: fh(getLayoutConfig().isTablet ? 8 : 6), 
    color: Colors.textcolor,
    includeFontPadding: false,
  },
  cardSubtitle: { 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    marginBottom: fh(getLayoutConfig().isTablet ? 12 : 10), 
    color: Colors.textcolor,
    includeFontPadding: false,
  },
  cardLink: { 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    textDecorationLine: "underline", 
    color: Colors.textcolor,
    includeFontPadding: false,
  },
  badgeLine: { 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    marginBottom: fh(getLayoutConfig().isTablet ? 10 : 8), 
    color: Colors.textcolor,
    includeFontPadding: false,
  },
  badgeStrong: { 
    textDecorationLine: "underline", 
    color: Colors.textcolor,
    includeFontPadding: false,
  },
  kvRowBox: { 
    width: "48%", 
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 12), 
    backgroundColor: Colors.deepPurple, 
    borderRadius: fr(8), 
    paddingVertical: fh(getLayoutConfig().isTablet ? 16 : 12), 
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 14 : 10) 
  },
  kvLabel: { 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    color: Colors.textcolor,
    includeFontPadding: false,
  },
  kvValue: { 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    marginTop: fh(getLayoutConfig().isTablet ? 6 : 4), 
    color: Colors.textcolor,
    includeFontPadding: false,
  },
  withdrawBtn: { 
    alignSelf: "flex-start", 
    height: fh(getLayoutConfig().isTablet ? 44 : 36), 
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 20 : 16), 
    borderRadius: fr(8), 
    justifyContent: "center", 
    alignItems: "center", 
    marginTop: fh(getLayoutConfig().isTablet ? 22 : 18) 
  },
  withdrawText: { 
    color: Colors.textcolor, 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12),
    includeFontPadding: false,
  },
});

export default ReporterDashboardScreen;
