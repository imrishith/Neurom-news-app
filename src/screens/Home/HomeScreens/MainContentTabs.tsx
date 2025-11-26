import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";

import BreakingNewsHeroCarousel from "../BreakingNewsHeroCarousel";
import TrendingHeroCarousel from "../Trending/TrendingHeroCarousel";
import PollsHeroCarousel from "../Polls/PollsHeroCarousel";

import { fw, fh, ff } from "../../../../utils/responsive";
import { useTheme } from "../../../context/ThemeContext";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useContentTabs } from "../../../hooks/useContentTabs";

const MainContentTabs = ({ navigation }) => {
  const { Colors } = useTheme();
  const { t, getFont } = useOnboarding();

  // ✅ Home has its own separate tab state
  const [homeActiveTab, setHomeActiveTab] = useState("breaking_news");

  // ✅ Article screen tab control
  const { activeTab, setActiveTab } = useContentTabs();

  // UI Tabs for Home
  const homeTabs = [
    { key: "breaking_news", mappedKey: "breaking", component: BreakingNewsHeroCarousel },
    { key: "trending", mappedKey: "trending", component: TrendingHeroCarousel },
    { key: "polls", mappedKey: "polls", component: PollsHeroCarousel },
  ];

  const handleHomeTabPress = (tab) => {
    setHomeActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      {/* 🔹 TOP TAB UI */}
      <View style={styles.topBar}>
        {homeTabs.map(({ key }) => {
          const isActive = homeActiveTab === key;

          return (
            <TouchableOpacity
              key={key}
              style={styles.tab}
              activeOpacity={0.8}
              onPress={() => handleHomeTabPress(key)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? Colors.textcolor : Colors.mediumGray,
                    fontFamily: getFont("regular"),
                  },
                ]}
              >
                {t(key)}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.underline,
                    { backgroundColor: Colors.lavenderPurple },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 🔹 Spacing */}
      <View style={{ height: fh(12) }} />

      {/* 🔥 TAB CONTENT */}
      {homeActiveTab === "breaking_news" && <BreakingNewsHeroCarousel onPress={(item) => {
        navigation.navigate("ArticleScreen", {
          articleId: item?.payload?.id,
          fromBreaking: true,
        });
      }}
      />}
      {homeActiveTab === "trending" && <TrendingHeroCarousel onPress={(item) => {
        navigation.navigate("ArticleScreen", {
          articleId: item?.payload?.id,
          fromBreaking: true,
        });
      }}
      />}
      {homeActiveTab === "polls" && <PollsHeroCarousel navigation={navigation} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: fh(5),
    marginTop: fh(5),
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: fh(8),
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: fw(8),
  },
  tabText: {
    fontSize: ff(14),
    fontWeight: "700",
    lineHeight: ff(22),
  },
  underline: {
    marginTop: fh(4),
    height: fh(3),
    width: "100%",
    borderRadius: fh(2),
  },
});

export default MainContentTabs;
