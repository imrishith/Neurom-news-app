import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ActivityIndicator, BackHandler, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { useDailyWrapsStore } from "../../../utils/store/useDailyWrapsStore";
import DailyWrapsReels, { WrapItem } from "../Wraps/Elements/DailyWrapsReels";
import NetInfo from "@react-native-community/netinfo";
import { MMKV } from "react-native-mmkv";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import TopBar from "../../components/TopBar";
import TopBarContainer from "../../components/layout/TopBarContainer";
import { useContentTabs } from "../../hooks/useContentTabs";
import { SafeAreaView } from "react-native-safe-area-context";
const mmkv = new MMKV();
const LAST_INDEX_KEY = "lastViewedWrapIndex";

type ApiWrap = {
  wrap_id: number;
  title_en?: string;
  title_te?: string;
  media_en?: { type: string; variants?: Record<string, string>; thumbnail?: string };
  media_te?: { type: string; variants?: Record<string, string>; thumbnail?: string };
  published_at?: string;
  stats?: any;
};

const measureApproxMbps = async (): Promise<number | null> => {
  try {
    const state = await NetInfo.fetch();
    // RN NetInfo may expose downlink in Mbps on some platforms; if present, use it.
    const dl: any = (state as any)?.details?.downlink;
    if (typeof dl === "number" && dl > 0) return dl;
  } catch { }
  return null; // unknown, fall back to default 720p
};

const pickVariantUrl = (variants?: Record<string, string>): string | null => {
  if (!variants) return null;

  const hlsOrder = ["hls_1080p", "hls_720p", "hls_480p"];

  for (const h of hlsOrder) {
    if (variants[h]) return variants[h];
  }

  return null; // ❌ No MP4 fallback
};






export default function DailyWrapsScreen() {
  const navigation = useNavigation<any>();
  const { Colors } = useTheme();
  const { getLangCode } = useOnboarding();
  const lang = getLangCode();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [speedMbps, setSpeedMbps] = useState<number | null>(null);
  const [initialIndex, setInitialIndex] = useState<number>(0);
  const { dailyWraps, fetchDailyWraps } = useDailyWrapsStore();
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const { tabs, categories, activeTab, setActiveTab, selectedCategories, setSelectedCategories } = useContentTabs();
  // backhandler done by rishith
  useEffect(() => {
    const backAction = () => {
      // ✅ Navigate to Home instead of exiting the app
      navigation.navigate("HomeScreen"); // change to your actual home route name
      return true; // prevent default back behavior (app exit)
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);



  // Restore last index
  useEffect(() => {
    try {
      const idx = mmkv.getNumber(LAST_INDEX_KEY);
      if (typeof idx === "number" && idx >= 0) setInitialIndex(idx);
    } catch { }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!refreshing) setLoading(true);
        await fetchDailyWraps();
        const mbps = await measureApproxMbps();
        if (mounted) setSpeedMbps(mbps);
      } catch (err) {
        console.error("❌ Error during wraps init:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [fetchDailyWraps, refreshing]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    (async () => {
      try {
        await fetchDailyWraps();
        const mbps = await measureApproxMbps();
        setSpeedMbps(mbps);
      } finally {
        setRefreshing(false);
      }
    })();
  }, [fetchDailyWraps]);

  const mapped: WrapItem[] = useMemo(() => {
    const mbps = speedMbps;
    return (dailyWraps || [])
      .map((it: any) => {
        const media = lang === "te" ? it.media_te : it.media_en;
        if (!media || media.type !== "video") return null;
        const uri = pickVariantUrl(media.variants, mbps);
        if (!uri) return null;
        return {
          video_id: it.wrap_id,
          _id: it.wrap_id,
          uri,
          title_en: it.title_en,
          title_te: it.title_te,
          title: lang === "te" ? it.title_te || it.title_en : it.title_en || it.title_te,
          thumbnail: media.thumbnail,
          published_at: it.published_at,
          stats: it.stats,
        } as WrapItem;
      })
      .filter(Boolean) as WrapItem[];
  }, [dailyWraps, lang, speedMbps]);

  const handleIndexChange = useCallback((idx: number) => {
    try {
      mmkv.set(LAST_INDEX_KEY, idx);
    } catch { }
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.lavenderPurple} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View style={[styles.topBarWrap, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <TopBarContainer
          backgroundColor={Colors.darkpurple}
        >
          <TopBar
            tabs={[]}
            activeTab={""}
            onTabPress={(key) => {
              if (key === "sidebar") setSidebarVisible(true);
              else setActiveTab("");
            }}
            labelStyle={{ color: "#ccc" }}
            activeLabelStyle={{
              color: Colors.topbarActiveLabel,
              fontWeight: "700",
            }}
          />
        </TopBarContainer>
      </View>
      <DailyWrapsReels
        videos={mapped}
        initialIndex={initialIndex}
        onIndexChange={handleIndexChange}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  topBarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
});
