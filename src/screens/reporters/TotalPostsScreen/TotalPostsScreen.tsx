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
import { fw, fh, ff } from "../../../../utils/responsive";
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
  screen: { flex: 1, paddingHorizontal: fw(16) },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: fh(4),
    paddingBottom: fh(8),
  },
  backIcon: { width: fw(20), height: fh(20) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: ff(16),
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: fh(30),
    marginBottom: fh(14),
  },
  statCard: {
    flex: 1,
    borderRadius: fw(12),
    paddingVertical: fh(20),
    paddingHorizontal: fw(20),
    marginRight: fw(10),
    height: fh(87),
    width: fw(110),
  },
  statTitle: {
    fontSize: ff(13),
    marginBottom: fh(8),
    textAlign: "center",
  },
  statValue: {
    fontSize: ff(12),
    fontWeight: "400",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: ff(14),
    marginBottom: fh(8),
    marginTop: fh(20),
  },

  postRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: fh(14),
    marginTop: fh(20),
  },
  postThumb: {
    width: fw(161),
    height: fh(129),
    borderRadius: fw(10),
    marginRight: fw(12),
  },
  postText: {
    flex: 1,
    fontSize: ff(14),
    fontWeight: "600",
  },
});
