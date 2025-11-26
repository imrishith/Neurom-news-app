import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  TouchableOpacity,
  ScrollView,
  Platform,
  BackHandler
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import Ionicons from "react-native-vector-icons/Ionicons";
import InteractionsRow from "../../../components/InteractionRow";
import { fw, fh, ff} from "../../../../utils/responsive";
import { BOTTOMBAR_HEIGHT } from "../../../constants/layout";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useTheme } from "../../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export type MagazinePage = { url: string; page_number: number };

type MagazineViewerProps = {
  pages: MagazinePage[];
  title: string;
  stats?: any;
  contentId: number | string;
  onClose: () => void;
  onShare: () => void;
};

export default function MagazineViewer({ pages, title, stats, contentId, onClose, onShare }: MagazineViewerProps) {
  const sortedPages = useMemo(() => [...(pages || [])].sort((a, b) => (a.page_number || 0) - (b.page_number || 0)), [pages]);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<MagazinePage> | null>(null);
  const { data } = useOnboarding();
  const { Colors, barStyle } = useTheme();
   const navigation = useNavigation();

  const insets = useSafeAreaInsets();

  const BOTTOM_BAR_HEIGHT = fh(45); 
  const BASE_MARGIN = fh(12); 
  const SAFE_BOTTOM = insets.bottom || 0;

  const FIXED_BOTTOM_OFFSET = BOTTOM_BAR_HEIGHT + SAFE_BOTTOM + BASE_MARGIN;


  // backhandler done by rishith
          useEffect(() => {
            const backAction = () => {
              // ✅ Navigate to Home instead of exiting the app
              navigation.navigate("ExploreMosaicScreen"); // change to your actual home route name
              return true; // prevent default back behavior (app exit)
            };
        
            const backHandler = BackHandler.addEventListener(
              "hardwareBackPress",
              backAction
            );
        
            return () => backHandler.remove();
          }, [navigation]);

  // Prefetch next image(s)
  useEffect(() => {
    const uris: string[] = [];
    const next1 = sortedPages[index + 1]?.url;
    const next2 = sortedPages[index + 2]?.url;
    const prev1 = sortedPages[index - 1]?.url;
    if (next1) uris.push(next1);
    if (next2) uris.push(next2);
    if (prev1) uris.push(prev1);
    if (uris.length) FastImage.preload(uris.map((u) => ({ uri: u })));
  }, [index, sortedPages]);

  const Page = ({ uri, active }: { uri: string; active: boolean }) => {
    const [loaded, setLoaded] = useState(false);
    return (
      <View style={styles.page}>
        <ScrollView
          style={styles.zoomContainer}
          contentContainerStyle={styles.zoomContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          centerContent
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <FastImage
            source={{ uri, priority: active ? FastImage.priority.high : FastImage.priority.normal }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
            onLoadStart={() => setLoaded(false)}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        </ScrollView>
        {/* {!loaded && (
          <View style={styles.loaderOverlay}>
            <Text style={styles.loaderText}>Loading…</Text>
          </View>
        )} */}
      </View>
    );
  };

  const renderItem = useCallback(({ item, index: i }: ListRenderItemInfo<MagazinePage>) => {
    const active = i === index;
    return (
      <View style={styles.page}>
        <Page uri={item.url} active={active} />
        {/* Overlays */}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={fw(26)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>Page {index + 1} / {sortedPages.length}</Text>
            <View style={{ width: fw(26) }} />
          </View>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.8)"]}
            style={styles.bottomGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.bottomTitleWrap}>
            {/* <Text style={styles.title} numberOfLines={2}>{title}</Text> */}
          </View>
          <View  style={[
            styles.interactionsWrap,
            { bottom: insets.bottom + fh(75) } // ⭐ ALWAYS ABOVE BOTTOMBAR
          ]}>
            <InteractionsRow
              stats={{
                likes_count: Number(stats?.likes_count || 0),
                comments_count: Number(stats?.comments_count || 0),
                dislikes_count: Number(stats?.dislikes_count || 0),
                shares_count: Number(stats?.shares_count || 0),
                views_count: Number(stats?.views_count || 0),
              }}
              tintColor={Colors.blackcolor}
              backgroundColor="#49425B33"
              compact
              contentType="magazines"
              contentId={contentId}
              deviceId={data?.device_id}
              onComment={() => {}}
              onShare={onShare}
              containerStyle={{ alignItems: "center" }}
            />
          </View>
        </View>
      </View>
    );
  }, [onClose, title, stats, contentId, data?.device_id, index, sortedPages.length]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={sortedPages}
        keyExtractor={(it) => String(it.page_number)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setIndex(idx);
        }}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        windowSize={3}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  page: { width: SCREEN_W, height: SCREEN_H, backgroundColor: "#000" },
  zoomContainer: { flex: 1 },
  zoomContent: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  image: { width: SCREEN_W, height: SCREEN_H, top:fh(15) },
  topBar: {
    position: "absolute",
    top: fh(35),
    left: 0,
    right: 0,
    height: fh(40),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: fw(12),
  },
  backBtn: {
    width: fw(36),
    height: fw(36),
    borderRadius: fw(18),
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageIndicator: { color: "#fff", fontSize: ff(14), fontWeight: "600" },
  bottomGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "28%" },
  bottomTitleWrap: { position: "absolute", left: fw(16), right: fw(16), bottom: fh(28) },
  title: { color: "#fff", fontSize: ff(16), fontWeight: "700" },
  interactionsWrap: { position: "absolute", alignSelf: 'center', backgroundColor:'#49425B33', borderRadius:30, width: fw(277)},
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  loaderText: { color: "#fff", fontSize: ff(12) },
});
