import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  BackHandler
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { fw, fh, ff, fr, getLayoutConfig } from "../../utils/responsive";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../context/OnboardingContext";
import GradientScreen from "../components/GradientScreen";
import { publicUsers } from "../api/publicapi/publicApi";

type SavedArticle = {
  article_id: number;
  title_en?: string;
  title_te?: string;
  media?: { url?: string; type?: string };
  slug?: string;
};

const SavedScreen = () => {
  const navigation = useNavigation<any>();
  const { Colors, theme } = useTheme();
  const { t, getFont, getLocalizedText, data } = useOnboarding();
  const barStyle = theme === "dark" ? "light-content" : "dark-content";

  const [items, setItems] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const fetchSaved = useCallback(async () => {
    try {
      setLoading(true);
      const deviceId = data?.device_id;
      if (!deviceId) {
        setItems([]);
        return;
      }
      const res = await publicUsers.getSavedArticlesByDevice(deviceId, 10, 0);
      if (res?.success && Array.isArray(res?.data?.items)) {
        setItems(res.data.items);
      } else {
        setItems([]);
      }
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const renderItem = ({ item }: { item: SavedArticle }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor: Colors.deepPurple }]}
      onPress={() => {
        if (item?.article_id) {
          // Navigate to ArticleScreen with the specific articleId
          navigation.navigate("ArticleScreen", { articleId: item.article_id });
        }
      }}
    >
      <Image
        source={{ uri: item?.media?.url || "" }}
        style={styles.thumbnail}
      />
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: Colors.textcolor, fontFamily: getFont("medium") },
          ]}
          numberOfLines={2}
        >
          {getLocalizedText(item as any, "title")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <GradientScreen style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={fw(22)} color={Colors.textcolor} />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { color: Colors.textcolor, fontFamily: getFont("semibold") },
            ]}
          >
            {t("saved")}
          </Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loader}> 
            <ActivityIndicator size="small" color={Colors.lavenderPurple} />
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.article_id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="bookmark-outline"
                  size={fw(60)}
                  color={Colors.lavenderPurple}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: Colors.textcolor, fontFamily: getFont("regular") },
                  ]}
                >
                  {t("no_saved_articles")}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: getLayoutConfig().contentPadding,
    paddingVertical: fh(getLayoutConfig().isTablet ? 16 : 12),
    height: getLayoutConfig().headerHeight,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: getLayoutConfig().contentPadding,
    padding: fw(6),
    zIndex: 10,
  },
  headerTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
    textAlign: "center",
    fontWeight: "600",
    includeFontPadding: false,
  },
  listContent: {
    paddingHorizontal: getLayoutConfig().contentPadding,
    marginTop: fh(getLayoutConfig().isTablet ? 24 : 20),
    paddingBottom: fh(40),
    gap: fh(getLayoutConfig().isTablet ? 16 : 12),
  },
  card: {
    flexDirection: "row",
    borderRadius: fr(getLayoutConfig().isTablet ? 12 : 10),
    padding: fw(getLayoutConfig().isTablet ? 16 : 10),
    alignItems: "center",
    minHeight: fh(getLayoutConfig().isTablet ? 80 : 70),
  },
  thumbnail: {
    width: fw(getLayoutConfig().isTablet ? 80 : 60),
    height: fh(getLayoutConfig().isTablet ? 80 : 60),
    borderRadius: fr(getLayoutConfig().isTablet ? 12 : 8),
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    marginLeft: fw(getLayoutConfig().isTablet ? 16 : 12),
    justifyContent: "center",
  },
  title: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    lineHeight: ff(getLayoutConfig().isTablet ? 22 : 20),
    includeFontPadding: false,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: fh(getLayoutConfig().isTablet ? 200 : 120),
    paddingHorizontal: fw(40),
  },
  emptyText: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 15),
    marginTop: fh(12),
    textAlign: "center",
    opacity: 0.8,
    lineHeight: ff(getLayoutConfig().isTablet ? 24 : 22),
    includeFontPadding: false,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SavedScreen;
