// screens/Reporter/TotalPostsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  BackHandler
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import GradientScreen from "../../../components/GradientScreen";
import { fw, fh, ff, fr, getLayoutConfig } from "../../../../utils/responsive";
import { useTheme } from "../../../context/ThemeContext";
import { useOnboarding } from "../../../context/OnboardingContext"; // ✅ translations + fonts
import { reporterArticles} from "../../../api/reporter/reporterApi";

const BAR_H = fh(64);

export default function TotalPostsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { Colors, barStyle } = useTheme();
  const { t, getFont } = useOnboarding();

  const [stats, setStats] = useState<any>({
    published: 0,
    submitted: 0,
    rejected: 0,
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);


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
    

  // 🔹 Fetch stats + posts
 useEffect(() => {
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const json = await reporterArticles.getStats();   // ✅ global API
      if (json.success) setStats(json.data);
    } catch (err) {
      console.error("❌ Stats fetch error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const json = await reporterArticles.getAll();     // ✅ global API
      if (json.success) setPosts(json.data || []);
    } catch (err) {
      console.error("❌ Posts fetch error:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  fetchStats();
  fetchPosts();
}, [navigation]);


  // 🔹 Render stat cards
  const renderStat = (labelKey: string, value: number) => (
    <View
      key={labelKey}
      style={[styles.statCard, { backgroundColor: Colors.deepPurple }]}
    >
      <Text
        style={[
          styles.statTitle,
          { color: Colors.mediumGray, fontFamily: getFont("semibold") },
        ]}
      >
        {t(labelKey)}
      </Text>
      <Text
        style={[
          styles.statValue,
          { color: Colors.textcolor, fontFamily: getFont("regular") },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  // 🔹 Render each post row
  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postRow}>
      {item.media?.url ? (
        <Image
          source={{ uri: item.media.url.replace(".avif", ".jpg") }}
          style={styles.postThumb}
        />
      ) : (
        <View
          style={[
            styles.postThumb,
            { backgroundColor: Colors.mediumGray + "33" },
          ]}
        />
      )}
      <Text
        style={[
          styles.postText,
          { color: Colors.textcolor, fontFamily: getFont("semibold") },
        ]}
        numberOfLines={7}
      >
        {/* Show localized content */}
        {item[`content_${t("lang_code")}`] || item.content_en || item.content_te}
      </Text>
    </View>
  );

  return (
    <GradientScreen style={{ flex: 1 }}>
      <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView edges={["top"]} style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require("../../../../assets/icons/backarrow.png")}
              style={[styles.backIcon, { tintColor: Colors.textcolor }]}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: Colors.textcolor, fontFamily: getFont("semibold") },
            ]}
          >
            {t("total_posts")}
          </Text>
          <View style={{ width: fw(24) }} />
        </View>

        {/* Stats */}
        {loadingStats ? (
          <ActivityIndicator
            size="small"
            color={Colors.lavenderPurple}
            style={{ marginVertical: fh(20) }}
          />
        ) : (
          <View style={styles.statsRow}>
            {renderStat("published", stats.published)}
            {renderStat("submitted", stats.submitted)}
            {renderStat("rejected", stats.rejected)}
          </View>
        )}

        {/* Recent posts */}
        <Text
          style={[
            styles.sectionTitle,
            { color: Colors.textcolor, fontFamily: getFont("semibold") },
          ]}
        >
          {t("recent_posts")}
        </Text>
        {loadingPosts ? (
          <ActivityIndicator
            size="large"
            color={Colors.lavenderPurple}
            style={{ marginTop: fh(30) }}
          />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => String(item.article_id)}
            renderItem={renderPost}
            contentContainerStyle={{
              paddingBottom: insets.bottom + BAR_H + fh(8),
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    paddingHorizontal: getLayoutConfig().contentPadding 
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: fh(getLayoutConfig().isTablet ? 8 : 4),
    paddingBottom: fh(getLayoutConfig().isTablet ? 12 : 8),
  },
  backIcon: { 
    width: fw(getLayoutConfig().isTablet ? 24 : 20), 
    height: fh(getLayoutConfig().isTablet ? 24 : 20) 
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16),
    fontWeight: "600",
    includeFontPadding: false,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: fh(getLayoutConfig().isTablet ? 34 : 30),
    marginBottom: fh(getLayoutConfig().isTablet ? 18 : 14),
  },
  statCard: {
    flex: 1,
    borderRadius: fr(getLayoutConfig().isTablet ? 16 : 12),
    paddingVertical: fh(getLayoutConfig().isTablet ? 24 : 20),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 24 : 20),
    marginRight: fw(getLayoutConfig().isTablet ? 14 : 10),
    height: fh(getLayoutConfig().isTablet ? 96 : 87),
    width: fw(getLayoutConfig().isTablet ? 120 : 110),
  },
  statTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 15 : 13),
    marginBottom: fh(getLayoutConfig().isTablet ? 10 : 8),
    textAlign: "center",
    includeFontPadding: false,
  },
  statValue: {
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12),
    fontWeight: "400",
    textAlign: "center",
    includeFontPadding: false,
  },

  sectionTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    marginBottom: fh(getLayoutConfig().isTablet ? 12 : 8),
    marginTop: fh(getLayoutConfig().isTablet ? 24 : 20),
    includeFontPadding: false,
  },

  postRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: fh(getLayoutConfig().isTablet ? 18 : 14),
    marginTop: fh(getLayoutConfig().isTablet ? 24 : 20),
  },
  postThumb: {
    width: fw(getLayoutConfig().isTablet ? 180 : 161),
    height: fh(getLayoutConfig().isTablet ? 144 : 129),
    borderRadius: fr(getLayoutConfig().isTablet ? 14 : 10),
    marginRight: fw(getLayoutConfig().isTablet ? 16 : 12),
  },
  postText: {
    flex: 1,
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    fontWeight: "600",
    includeFontPadding: false,
  },
});
