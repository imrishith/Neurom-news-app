import React, { useState , useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  BackHandler
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import GradientScreen from "../../../components/GradientScreen";
import AppHeader from "../../../components/AppHeader";
import { fw, fh, ff, fr, getLayoutConfig } from "../../../../utils/responsive";
import { useTheme } from "../../../context/ThemeContext";
import { useOnboarding } from "../../../context/OnboardingContext";
import Ionicons from "react-native-vector-icons/Ionicons"; // ⭐ for stars

type RowProps = {
  labelKey: string;
  icon: any;
  onPress?: () => void;
  rightText?: string;
  disabled?: boolean;
};

const Row = ({ labelKey, icon, onPress, rightText, disabled }: RowProps) => {
  const { Colors } = useTheme();
  const { t, getFont } = useOnboarding();
  const Comp: any = onPress && !disabled ? TouchableOpacity : View;

  return (
    <Comp
      style={[styles.row, { backgroundColor: Colors.deepPurple }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Image source={icon} style={[styles.rowIcon, { tintColor: Colors.textcolor }]} />
      <Text
        style={[
          styles.rowText,
          { color: Colors.textcolor, fontFamily: getFont("regular") },
        ]}
        numberOfLines={1}
      >
        {t(labelKey)}
      </Text>

      {rightText ? (
        <Text
          style={[
            styles.rowRightText,
            { color: Colors.textcolor, fontFamily: getFont("regular") },
          ]}
          numberOfLines={1}
        >
          {rightText}
        </Text>
      ) : null}
    </Comp>
  );
};

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { Colors, theme } = useTheme();
  const { t, getFont } = useOnboarding();
  const barStyle = theme === "dark" ? "light-content" : "dark-content";

  // ⭐ State for rating stars
  const [rating, setRating] = useState<number>(0);


     // backhandler done by rishith
              useEffect(() => {
                const backAction = () => {
                  // ✅ Navigate to Home instead of exiting the app
                  navigation.navigate("ProfileWelcomeScreen"); // change to your actual home route name
                  return true; // prevent default back behavior (app exit)
                };
            
                const backHandler = BackHandler.addEventListener(
                  "hardwareBackPress",
                  backAction
                );
            
                return () => backHandler.remove();
              }, [navigation]);
    

  return (
    <GradientScreen style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />

        <AppHeader
          backgroundColor="transparent"
          title={t("settings")}
          titleStyle={{
            color: Colors.textcolor,
            fontWeight: "700",
            marginRight: fw(50),
            fontFamily: getFont("bold"),
          }}
          leftComponents={[
            <TouchableOpacity
              key="back"
              onPress={() => navigation.goBack()}
              style={{ paddingHorizontal: fw(8) }}
            >
              <Image
                source={require("../../../../assets/icons/backarrow.png")}
                style={[styles.headerIcon, { tintColor: Colors.textcolor }]}
              />
            </TouchableOpacity>,
          ]}
          rightComponents={[]}
        />

        <View style={styles.content}>
          {/* Section: Help & Support */}
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors.textcolor, fontFamily: getFont("semiBold") },
            ]}
          >
            {t("help_support")}
          </Text>
          <Row
            labelKey="faqs"
            icon={require("../../../../assets/icons/faq.png")}
            onPress={() => navigation.navigate("FaqScreen")}
          />
          <Row
            labelKey="report_problem"
            icon={require("../../../../assets/icons/report.png")}
            onPress={() => navigation.navigate("ReportIssueScreen")}
          />
          <Row
            labelKey="contact_us"
            icon={require("../../../../assets/icons/phone.png")}
            onPress={() => navigation.navigate("ContactScreen")}
          />

          {/* Section: Policies */}
          <Text
            style={[
              styles.sectionTitle,
              {
                marginTop: fh(18),
                color: Colors.textcolor,
                fontFamily: getFont("semiBold"),
              },
            ]}
          >
            {t("policies")}
          </Text>
          <Row
            labelKey="privacy_policy"
            icon={require("../../../../assets/icons/privacy.png")}
            onPress={() => navigation.navigate("PrivacyPolicyScreen")}
          />
          <Row
            labelKey="terms_conditions"
            icon={require("../../../../assets/icons/calender.png")}
            onPress={() => navigation.navigate("TermsScreen")}
          />
          <Row
            labelKey="app_version"
            icon={require("../../../../assets/icons/Appversion.png")}
            rightText="89.00945"
            disabled
          />

          {/* ⭐ Section: Rate This App */}
          {/* <Text
            style={[
              styles.sectionTitle,
              {
                marginTop: fh(20),
                color: Colors.textcolor,
                fontFamily: getFont("semiBold"),
              },
            ]}
          >
            {t("rate_this_app")}
          </Text>

          <View
            style={[
              styles.rateContainer,
              { backgroundColor: Colors.deepPurple, borderColor: Colors.lavenderPurple },
            ]}
          >
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={fw(28)}
                    color={star <= rating ? "#FFD700" : Colors.textcolor}
                    style={{ marginHorizontal: fw(4) }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: Colors.lavenderPurple },
              ]}
              activeOpacity={0.9}
              onPress={() => {
                console.log("⭐ Rating submitted:", rating);
                // You can later link this to Play Store / backend
              }}
            >
              <Text
                style={[
                  styles.submitText,
                  { fontFamily: getFont("semibold"), color: "#fff" },
                ]}
              >
                {t("submit_rating")}
              </Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </SafeAreaView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerIcon: { 
    width: fw(getLayoutConfig().isTablet ? 26 : 22), 
    height: fw(getLayoutConfig().isTablet ? 26 : 22) 
  },
  content: {
    paddingHorizontal: getLayoutConfig().contentPadding,
    paddingTop: fh(getLayoutConfig().isTablet ? 24 : 20),
    paddingBottom: fh(24),
  },
  sectionTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
    opacity: 0.9,
    marginBottom: fh(getLayoutConfig().isTablet ? 14 : 10),
    fontWeight: "600",
    includeFontPadding: false,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 16 : 12),
    height: fh(getLayoutConfig().isTablet ? 56 : 48),
    borderRadius: fr(10),
    marginBottom: fh(getLayoutConfig().isTablet ? 14 : 10),
  },
  rowIcon: {
    width: fw(getLayoutConfig().isTablet ? 28 : 24),
    height: fw(getLayoutConfig().isTablet ? 28 : 24),
    opacity: 0.9,
    marginRight: fw(getLayoutConfig().isTablet ? 14 : 10),
  },
  rowText: { 
    flex: 1, 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14), 
    fontWeight: "400",
    includeFontPadding: false,
  },
  rowRightText: { 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12), 
    opacity: 0.85,
    includeFontPadding: false,
  },

  // ⭐ Rate Section
  rateContainer: {
    borderRadius: fr(10),
    paddingVertical: fh(getLayoutConfig().isTablet ? 20 : 16),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 20 : 16),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: fh(getLayoutConfig().isTablet ? 12 : 8),
  },
  submitButton: {
    marginTop: fh(getLayoutConfig().isTablet ? 14 : 10),
    paddingVertical: fh(getLayoutConfig().isTablet ? 14 : 10),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 24 : 20),
    borderRadius: fr(8),
  },
  submitText: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    textAlign: "center",
    includeFontPadding: false,
  },
});
