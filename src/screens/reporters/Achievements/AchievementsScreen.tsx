// screens/Achievements/AchievementsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import GradientScreen from "../../../components/GradientScreen";
import { fw, fh, ff } from "../../../../utils/responsive";
import { useTheme } from "../../../context/ThemeContext";
import { useOnboarding } from "../../../context/OnboardingContext"; // ✅ for translations
import { reporterAchievements } from "../../../api/reporter/reporterApi"; // ✅ import

export default function AchievementsScreen() {
  const navigation = useNavigation<any>();
  const { Colors, barStyle } = useTheme();
  const { t, getFont } = useOnboarding(); // ✅ translation hook

  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

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
    

  useEffect(() => {
  const fetchAchievements = async () => {
    try {
      setLoading(true);

      const json = await reporterAchievements.getAll(); // ✅ use global API

    

      const list = json.data || json.achievements || [];
      if (Array.isArray(list)) {
        setAchievements(list);

        const total = list.reduce(
          (acc: number, a: any) => acc + (a.points || 0),
          0
        );
        setTotalPoints(total);
      } else {
        Alert.alert("Error", "Could not load achievements");
      }
    } catch (err: any) {
      console.error("❌ Achievements fetch error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  fetchAchievements();
}, []);

  const renderAchievement = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: Colors.deepPurple }]}>
      <Image
        source={require("../../../../assets/icons/check.png")}
        style={[styles.cardIcon, { tintColor: Colors.textcolor }]}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: Colors.textcolor }]}>
          {item.level?.toUpperCase() || "Badge"}
        </Text>
        <Text style={[styles.cardDesc, { color: Colors.textcolor, fontFamily: getFont('regular') }]}>
          {t("earned_points_on")} {item.points} {t("points")}{" "}
          {item.earned_at
            ? new Date(item.earned_at).toDateString()
            : "N/A"}
        </Text>
      </View>
    </View>
  );

  return (
    <GradientScreen style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={barStyle} />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Image
              source={require("../../../../assets/icons/backarrow.png")}
              style={[styles.backIcon, { tintColor: Colors.textcolor }]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors.textcolor }]}>
            {t("my_achievements")}
          </Text>
          <View style={{ width: fw(28) }} />
        </View>

        {/* Points */}
        <View style={styles.pointsWrap}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.lavenderPurple} />
          ) : (
            <>
              <Text style={[styles.pointsValue, { color: Colors.textcolor }]}>
                {totalPoints}
              </Text>
              <Text style={[styles.pointsSub, { color: Colors.textcolor }]}>
                {t("total_points_earned")}
              </Text>

              {/* Progress bar */}
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: Colors.mediumGray },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: Colors.lavenderPurple,
                      width: `${Math.min(totalPoints, 100)}%`,
                    },
                  ]}
                />
              </View>

              {/* Milestones */}
              <View style={styles.milestonesRow}>
                <Image
                  source={require("../../../../assets/icons/badge.png")}
                  style={[styles.milestoneIcon, { tintColor: Colors.textcolor }]}
                />
                <Image
                  source={require("../../../../assets/icons/reward.png")}
                  style={[styles.milestoneIconDim, { tintColor: Colors.textcolor }]}
                />
                <Image
                  source={require("../../../../assets/icons/crown.png")}
                  style={[styles.milestoneIconDim, { tintColor: Colors.textcolor }]}
                />
                <Image
                  source={require("../../../../assets/icons/diamond.png")}
                  style={[styles.milestoneIconDim, { tintColor: Colors.textcolor }]}
                />
              </View>
            </>
          )}
        </View>

        {/* Achievements List */}
        <FlatList
          data={achievements}
          keyExtractor={(i) => String(i.id || i._id)}
          renderItem={renderAchievement}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <Text style={{ textAlign: "center", color: Colors.textcolor }}>
                {t("no_achievements")}
              </Text>
            ) : null
          }
        />
      </SafeAreaView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: fw(16),
    marginTop: fh(6),
    marginBottom: fh(6),
  },
  backBtn: { padding: fw(6), marginRight: fw(8) },
  backIcon: { width: fw(20), height: fw(20) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: ff(16),
    fontWeight: "600",
  },
  pointsWrap: {
    alignItems: "center",
    paddingHorizontal: fw(20),
    marginTop: fh(8),
    marginBottom: fh(8),
  },
  pointsValue: {
    fontSize: ff(40),
    fontWeight: "600",
    marginTop: fh(6),
    fontFamily: "AnekTelugu-SemiBold",
  },
  pointsSub: {
    fontSize: ff(20),
    marginTop: fh(4),
    marginBottom: fh(14),
    fontFamily: "AnekTelugu-SemiBold",
  },
  progressTrack: {
    width: "88%",
    height: fh(10),
    borderRadius: fh(10),
    opacity: 0.9,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: fh(10),
  },
  milestonesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "76%",
    marginTop: fh(16),
  },
  milestoneIcon: { width: fw(35), height: fw(35), marginTop: fh(10) },
  milestoneIconDim: {
    width: fw(35),
    height: fw(35),
    opacity: 0.65,
    marginTop: fh(10),
  },
  listContent: {
    marginTop: fh(20),
    paddingHorizontal: fw(16),
    paddingBottom: fh(90),
    gap: fh(20),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: fw(12),
    paddingVertical: fh(14),
    paddingHorizontal: fh(14),
  },
  cardIcon: {
    width: fw(28),
    height: fw(28),
    marginRight: fw(12),
    marginTop: fh(-15),
  },
  cardTitle: {
    fontSize: ff(15),
    fontWeight: "600",
    fontFamily: "AnekTelugu-SemiBold",
    paddingVertical: fh(10),
  },
  cardDesc: {
    fontSize: ff(12),
    marginTop: fh(-10),
    fontWeight: "400",
  },
});
