import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  BackHandler
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";


// Components
import GradientScreen from "../../components/BackgoundGradient";
import AppHeader from "../../components/AppHeader";
import LiveUpdatesCarousel from "./HomeScreens/LiveUpdatesCarousel";
import MainContentTabs from "./HomeScreens/MainContentTabs";
import ExploreCarousel from "./HomeScreens/ExploreCarousel";
import ExclusivesCarousel from "./HomeScreens/ExclusivesCarousel";
import LocalEventsCarousel from "./HomeScreens/LocalEventsCarousel";
import MarketCarousel from "./HomeScreens/MarketCarousel";
import { usePrefetchContent } from "../../hooks/usePrefetchContent";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../context/ThemeContext";
import { performance } from "react-native-performance";

// Utils
import { fw, fh } from "../../../utils/responsive";
import Colors from "../../constants/colors";
// import { API_CONFIG } from "../../api/config/apiConfig";

const HomeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { Colors, barStyle } = useTheme();

  useEffect(() => {
    const now = global.performance?.now?.() ?? Date.now();
      console.log(`📌 ${route.name} mounted at`, now);
  }, []);
  

  const routeToKey: Record<string, string> = {
    HomeScreen: "home",
    ArticleScreen: "search",
    HelloWorldScreen: "profile",
    BuzzScreen: "buzz",
  };
  const activeKey = routeToKey[route.name] ?? "search";

   // backhandler done by rishith

  useEffect(() => {
      const backAction = () => {
        navigation.navigate("ArticleScreen");   // 👈 ALWAYS go to Home
        return true; // prevent default exit behavior
      };
    
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
    
      return () => backHandler.remove();
    }, []);
    



   usePrefetchContent();

  // 🔄 Fetch live sports score


  

  return (
    <GradientScreen>
      <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1 }}
    >
        {/* ✅ Transparent StatusBar */}
        {/* <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        /> */}
        <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />

        {/* Header */}
        <AppHeader
          backgroundColor="transparent"
          showBottomDivider={false}
          containerStyle={{
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          }}
          leftComponents={[
            <Image
              key="logo"
              source={require("../../../assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />,
          ]}
          rightComponents={[
            <TouchableOpacity
          key="search"
          style={styles.iconWrapper}
          onPress={() => navigation.navigate("SearchScreen")}
        >
          <Image
            source={require("../../../assets/icons/search.png")}
            style={styles.iconsearch}
          />
        </TouchableOpacity>
,
            <TouchableOpacity
              key="person"
              style={styles.iconWrapper}
              onPress={() => navigation.navigate("ProfileWelcomeScreen")}
            >
              <Image
                source={require("../../../assets/icons/person.png")}
                style={styles.iconprofile}
              />
            </TouchableOpacity>,
          ]}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ✅ Live Updates */}
          <LiveUpdatesCarousel />

          

          {/* ✅ Other sections */}
          <MainContentTabs navigation={navigation} />
          <ExploreCarousel />

          {/* ⬇️ Add arrow here */}
          {/* <View style={styles.arrowContainer}>
            <Ionicons
              name="chevron-forward-outline"   // 👉 right arrow
              size={fw(24)}
              color={Colors.lavenderPurple}
            />
          </View> */}
          <ExclusivesCarousel />
          <LocalEventsCarousel />
          <MarketCarousel />
        </ScrollView>
      </SafeAreaView>
    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  headerLogo: {
    width: fw(74),
    height: fh(22),
    marginLeft: fw(10),
    tintColor: Colors.lavenderPurple
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: fh(80),
    marginTop: fh(-10),
  },
  iconWrapper: {
    paddingHorizontal: fw(6),
    marginLeft: fw(-10),
  },
  iconprofile: {
    width: fw(24),
    height: fh(24),
  },
  iconsearch: {
    width: fw(17),
    height: fh(17),
  },
  arrowContainer: {
  alignItems: "flex-end",
  justifyContent: "center",
  marginVertical: fh(8),
},
});

export default HomeScreen;

