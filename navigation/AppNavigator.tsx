// AppNavigator.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, BackHandler, Platform, ToastAndroid } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigationState, useNavigation } from "@react-navigation/native";
import { performance } from "react-native-performance";
import DeviceInfo from "react-native-device-info";
import { getDevice } from "../src/api/device/deviceService";
import { useOnboarding } from "../src/context/OnboardingContext";
import LoginScreen from "../src/components/LoginScreen";
import { SuspenseWrapper } from "./SuspenseWrapper";
import { MMKV } from "react-native-mmkv";



const SearchScreen = React.lazy(() =>
  import("../src/screens/SearchScreen")
);

import SavedScreen from "../src/screens/SavedScreen";

// 📌 Screens
const HomeScreen = React.lazy(() =>
  import("../src/screens/Home/Home")
);

const ArticleScreen = React.lazy(() =>
  import("../src/screens/Articles/ArticleScreen")
);

const ReelsScreen = React.lazy(() =>
  import("../src/screens/PostScreen/ReelsScreen")
);

const BuzzScreen = SuspenseWrapper(
  React.lazy(() => import("../src/screens/buzz/BuzzScreen"))
);

const VerticalPollsCarousel = React.lazy(() =>
  import("../src/screens/Polls/PollsScreen")
);
const DailyWrapsScreen = React.lazy(() =>
  import("../src/screens/DailyWraps/DailyWrapsScreen")
);

const LiveUpdatesScreen = React.lazy(() =>
  import("../src/screens/LiveUpdates/LiveUpdate")
);
const LanguageScreen = React.lazy(() =>
  import("../src/screens/Language/LanguageScreen")
);

const LocationScreen = React.lazy(() =>
  import("../src/screens/Location/Location")
)
const GetStarted = React.lazy(() =>
  import("../src/screens/GetStarted/GetStartedScreen")
)
const VoiceScreen = React.lazy(() =>
  import("../src/screens/Voice/VoiceScreen")
)
const ProfileWelcomeScreen = React.lazy(() =>
  import("../src/screens/reporters/profile/ProfileWelcomeScreen")
)
const ReporterDashboardScreen = React.lazy(() =>
  import("../src/screens/reporters/ReporterDashboard/ReporterDashboardScreen")
)
const PostNewsScreen = React.lazy(() =>
  import("../src/screens/reporters/PostNews/PostNewsScreen")
)
const AchievementsScreen = React.lazy(() =>
  import("../src/screens/reporters/Achievements/AchievementsScreen")
)
const TotalPostsScreen = React.lazy(() =>
  import("../src/screens/reporters/TotalPostsScreen/TotalPostsScreen")
)
const SettingsScreen = React.lazy(() =>
  import("../src/screens/reporters/settings/SettingsScreen")
)
const ExploreMosaicScreen = React.lazy(() =>
  import("../src/screens/magzine/ExploreMosaicScreen")
)
const UserRegistrationScreen = React.lazy(() =>
  import("../src/screens/registration")
)
const FullScreenMedia = React.lazy(() =>
  import("../src/screens/Articles/FullScreenMedia")
)

import StartScreen from "../src/screens/GetStarted/GetStartedScreen"; // ✅ Import your splash screen
import TtsTestScreen from "../src/components/TtsTestScreen";
import { getStableDeviceId } from "../utils/deviceId";
import { BottomToast } from "../src/components/BottomToast";
// 📌 Custom BottomBar
import Bottombar from "../src/components/Bottombar";

const RootStack = createNativeStackNavigator();
const InnerStack = createNativeStackNavigator();

// ✅ Screens where BottomBar should be hidden
const hiddenBottomBarScreens = [
  "LanguageScreen",
  "VoiceScreen",
  "LocationScreen",
  "GetStarted",
  "ProfileWelcomeScreen",
  "PostNewsScreen",
  "StartScreen", // ✅ Add splash screen to hidden list
];

// ✅ Default BottomBar items
const defaultBottomBarItems = [
  {
    key: "home",
    label: "Home",
    routeName: "HomeScreen",
    iconSource: require("../assets/icons/Home.png"),
    iconSize: 26,
    activeIconSize: 26,
  },
  {
    key: "articles",
    label: "Articles",
    routeName: "ArticleScreen",
    iconSource: require("../assets/icons/articles.png"),
  },
  {
    key: "reels",
    label: "Reels",
    routeName: "ReelsScreen",
    iconSource: require("../assets/icons/reels.png"),
  },
  {
    key: "buzz",
    label: "Buzz",
    routeName: "BuzzScreen",
    iconSource: require("../assets/icons/buzz.png"),
  },

  {
    key: "report", // 👈 new button
    label: "Report",
    routeName: "ReportForm", // fake route, we’ll intercept
    iconSource: require("../assets/icons/report.png"), // add your own icon in assets/icons
    iconSize: 24,
    activeIconSize: 24,
  },
];

// ✅ Reporter BottomBar
const reporterBottomBarItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    routeName: "ReporterDashboardScreen",
    iconSource: require("../assets/icons/Home.png"),
    iconSize: 24,
    activeIconSize: 24,
  },
  {
    key: "posts",
    label: "Posts",
    routeName: "TotalPostsScreen",
    iconSource: require("../assets/icons/articles.png"),
  },
  {
    key: "settings",
    label: "Settings",
    routeName: "LocationScreen",
    iconSource: require("../assets/icons/location-detect.png"),
  },
];

// ✅ Config map
const bottomBarConfigs: Record<string, any[]> = {
  TotalPostsScreen: reporterBottomBarItems,
  ReporterDashboardScreen: reporterBottomBarItems,
  AchievementsScreen: reporterBottomBarItems,
  SettingsScreen: reporterBottomBarItems,
};

function InnerStackWithBottomBar({ navReady }: { navReady: boolean }) {

  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom === 0 ? 28 : insets.bottom;


  const navigation = useNavigation<any>();
  const { updateData } = useOnboarding();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const lastBackPressRef = useRef(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const storage = new MMKV({ id: "onboarding" });

  // Navigation performance instrumentation
  useEffect(() => {
    const now = global.performance?.now?.() ?? Date.now();
    console.log("⏱ NAV STATE CHANGE:", now);
  }, []);


  // ⛔ Skip global back handler for these screens done by rishith
  const skipScreens = [
    "ProfileWelcomeScreen",
    "ReporterDashboardScreen",
    "ReelsScreen",
    "HomeScreen",
    "BuzzScreen",
    "pollScreen",
    "LiveUpdateScreen",
    "PostNewsScreen",
    "SettingsScreen",
    "TotalPostsScreen",
    "AchievementsScreen",
    "ExploreMosaicScreen",
    "DailyWrapsScreen",
    "SearchScreen",
    "SavedArticlesScreen",
    "LocationScreen",
  ];

  // ✅ This hook must always run (not conditionally)
  const currentRouteName = useNavigationState((state) => {
    if (!state) return null;
    let route = state.routes[state.index];
    while (route.state && route.state.index !== undefined) {
      route = route.state.routes[route.state.index];
    }
    return route.name;
  });

  useEffect(() => {
    const handler = () => {

      // 🚫 Ignore global handler for skipScreens done by rishith
      if (skipScreens.includes(currentRouteName)) {
        return false; // let screen-level BackHandler run
      }
      const now = Date.now();
      if (now - lastBackPressRef.current < 1500) { // ✅ Correct logic
        BackHandler.exitApp();
        return true;
      }
      lastBackPressRef.current = now; // ✅ Updates ref for next press

      if (currentRouteName !== "ArticleScreen") {
        try { navigation.navigate("ArticleScreen"); } catch (_) { }
      }

      if (Platform.OS === "android") {
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), 1500);
      }
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => sub.remove();
  }, [currentRouteName, navigation]);


  // ⏳ Check device registration
  useEffect(() => {
    const checkRegistration = async () => {
  try {
    const saved = storage.getString("onboardingData");
    const offlineData = saved ? JSON.parse(saved) : null;

    const net = await NetInfo.fetch();

    // ===========================
    // 🔴 CASE 1: INTERNET OFFLINE
    // ===========================
    if (!net.isConnected) {
      console.log("📵 Offline mode detected");

      if (offlineData?.device_id) {
        console.log("➡️ Navigating to ArticleScreen (offline login)");
        setInitialRoute("ArticleScreen");
      } else {
        console.log("➡️ No MMKV device, show onboarding");
        setInitialRoute("LocationScreen");
      }

      return; // 🔚 stop here, skip API call
    }

    // ===========================
    // 🟢 CASE 2: INTERNET ONLINE
    // ===========================
    const deviceId = await getStableDeviceId();

    const res = await getDevice(deviceId);

    if (res?.success && res.data) {
      const d = res.data.device;

      updateData({
        device_id: d.device_id,
        language_id: d.language_id,
        voice: d.voice || "Female",
        state_id: d.state_id,
        district_id: d.district_id,
        district_name: d.district?.name,
        mandal_id: d.mandal_id,
        mandal_name: d.mandal?.name,
        village_id: d.village_id,
        village_name: d.village?.name,
        constituency_id: d.constituency_id,
        isRegistered: true,
        language_code: d.language.code
      });

      setInitialRoute("ArticleScreen");
    } else {
      setInitialRoute("LocationScreen");
    }
  } catch (err) {
    console.error("❌ Registration check failed:", err);
    setInitialRoute("LocationScreen");
  } finally {
    setIsCheckingRegistration(false);
  }
};

    Promise.all([
      checkRegistration(),
      new Promise(resolve => setTimeout(resolve, 2000)), // splash delay
    ]);
  }, []);

  // ✅ Show splash screen while checking registration
  if (isCheckingRegistration || !initialRoute) {
    return <StartScreen />;
  }



  // ✅ Stable hook usage (always run, only UI conditional)
  const tabRouteMapping: Record<string, string> = {
    ArticleScreen: "ArticleScreen",
  };
  const resolvedRouteName =
    (currentRouteName && tabRouteMapping[currentRouteName]) ||
    currentRouteName ||
    "HomeScreen";

  const isHidden = hiddenBottomBarScreens.includes(resolvedRouteName);
  const bottomBarItems =
    bottomBarConfigs[currentRouteName] || defaultBottomBarItems;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <InnerStack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",  // ⭐ global transition
            gestureEnabled: true,
            animationDuration: 260,
          }}
        >
          {/* ✅ Splash Screen - Only shown during registration check */}
          <InnerStack.Screen name="StartScreen" component={StartScreen} />

          {/* BottomBar main screens */}
          <InnerStack.Screen name="HomeScreen" component={HomeScreen} />
          <InnerStack.Screen name="ArticleScreen" component={ArticleScreen} />
          <InnerStack.Screen
            name="ReelsScreen"
            component={ReelsScreen}
            options={{ animation: "none" }}
          />
          <InnerStack.Screen
            name="BuzzScreen"
            component={BuzzScreen}
            options={{ unmountOnBlur: true, animation: "none" }}
          />
          <InnerStack.Screen name="TtsTestScreen" component={TtsTestScreen} />

          {/* Other stack-only screens */}
          <InnerStack.Screen name="pollScreen" component={VerticalPollsCarousel} />
          <InnerStack.Screen name="LiveUpdateScreen" component={LiveUpdatesScreen} />
          <InnerStack.Screen name="LanguageScreen" component={LanguageScreen} options={{
            animation: "slide_from_right"
          }} />
          <InnerStack.Screen name="LocationScreen" component={LocationScreen} />
          <InnerStack.Screen name="GetStarted" component={GetStarted} />
          <InnerStack.Screen name="VoiceScreen" component={VoiceScreen} />
          <InnerStack.Screen name="ProfileWelcomeScreen" component={ProfileWelcomeScreen} />
          <InnerStack.Screen name="ReporterDashboardScreen" component={ReporterDashboardScreen} />
          <InnerStack.Screen name="PostNewsScreen" component={PostNewsScreen} />
          <InnerStack.Screen name="AchievementsScreen" component={AchievementsScreen} />
          <InnerStack.Screen name="TotalPostsScreen" component={TotalPostsScreen} />
          <InnerStack.Screen name="SettingsScreen" component={SettingsScreen} />
          <InnerStack.Screen
            name="ExploreMosaicScreen"
            component={ExploreMosaicScreen}
            options={{ animation: "none" }}
          />
          <InnerStack.Screen name="UserRegistrationScreen" component={UserRegistrationScreen} />
          <InnerStack.Screen name="DailyWrapsScreen" component={DailyWrapsScreen} />
          <InnerStack.Screen name="FullScreenMedia" component={FullScreenMedia} />
          <InnerStack.Screen name="SearchScreen" component={SearchScreen} />
          <InnerStack.Screen name="SavedArticlesScreen" component={SavedScreen} />
        </InnerStack.Navigator>
        <BottomToast message="Press back again to exit  " visible={showExitToast} />
      </View>

      {/* ✅ Render BottomBar only when allowed */}
      {!isHidden && (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#000" }}>
          <View >
            <Bottombar
              showLabels={false}
              activeRouteName={resolvedRouteName}
              items={bottomBarItems}
            />
          </View>
        </SafeAreaView>
      )}

    </View>
  );
}

const AppNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Main" component={InnerStackWithBottomBar} />
  </RootStack.Navigator>

);

export default AppNavigator;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
