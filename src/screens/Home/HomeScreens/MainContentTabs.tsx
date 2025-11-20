// src/screens/Home/components/MainContentTabs.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import BreakingNewsHeroCarousel from '../BreakingNewsHeroCarousel';
import TrendingHeroCarousel from '../Trending/TrendingHeroCarousel';
import PollsHeroCarousel from '../Polls/PollsHeroCarousel';
import { fw, fh, ff } from '../../../../utils/responsive';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext'; // ✅ import

const MainContentTabs = ({ navigation }) => {
  const { Colors } = useTheme();
  const { t, getFont } = useOnboarding(); // ✅ translations + font

  // use translated tab keys
  const tabs = [
    { key: "breaking_news", component: BreakingNewsHeroCarousel },
    { key: "trending", component: TrendingHeroCarousel },
    { key: "polls", component: PollsHeroCarousel },
  ];

  const [activeTab, setActiveTab] = useState("breaking_news");

  return (
    <View style={styles.container}>
      {/* TopBar */}
      <View style={styles.topBar}>
        {tabs.map(({ key }) => {
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={styles.tab}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? Colors.textcolor : Colors.mediumGray, fontFamily: getFont("regular") },
                  isActive && styles.activeTabText,
                ]}
              >
                {t(key)} {/* ✅ translated label */}
              </Text>
              {isActive && (
                <View
                  style={[
                    // styles.underline,
                    { backgroundColor: Colors.lavenderPurple },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: fh(12) }} />

      {/* Tab Content */}
      {activeTab === "breaking_news" && <BreakingNewsHeroCarousel navigation={navigation} />}
      {activeTab === "trending" && <TrendingHeroCarousel navigation={navigation} />}
      {activeTab === "polls" && <PollsHeroCarousel navigation={navigation} />}
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
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: fh(8),
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: fw(8),
  },
  tabText: {
    fontSize: ff(14),
    fontWeight: '700',
    lineHeight: Platform.OS === "ios" ? ff(35) : ff(22),
  },
  activeTabText: {
    fontSize: ff(14),
    fontWeight: '700',
  },
  underline: {
    marginTop: fh(4),
    height: fh(3),
    alignSelf: 'stretch',
    borderRadius: fh(2),
  },
});

export default MainContentTabs;
