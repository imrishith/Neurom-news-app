import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { fw, fh, ff, fr, getLayoutConfig } from '../../utils/responsive';
import { useTheme } from '../context/ThemeContext';

interface TabItem {
  key: string;
  label?: string;
  icon?: ImageSourcePropType;
  iconStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

interface TopBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;

  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;

  labelStyle?: TextStyle;
  activeLabelStyle?: TextStyle;
  iconStyle?: ViewStyle;
  activeIconStyle?: ViewStyle;

  showBottomBorder?: boolean;
  labelContainerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

const TopBar: React.FC<TopBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  containerStyle,
  tabStyle,
  activeTabStyle,
  labelStyle,
  activeLabelStyle,
  iconStyle,
  activeIconStyle,
  showBottomBorder = false,
  contentContainerStyle,
}) => {
  const { Colors } = useTheme();
  const flatListRef = useRef<FlatList<any>>(null);

  // auto-scroll when activeTab changes
  useEffect(() => {
    const index = tabs.findIndex((t) => t.key === activeTab);
    if (index >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5, // center the active tab
      });
    }
  }, [activeTab, tabs]);

  const renderItem = ({ item }: { item: TabItem }) => {
    const isActive = activeTab === item.key;
    const isPlus = item.key === 'sidebar';
    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.tab,
          tabStyle,
          isActive && [styles.activeTab, activeTabStyle],
        ]}
        onPress={() => onTabPress(item.key)}
        activeOpacity={0.8}
      >
        {isPlus ? (
          item.icon ? (
            <Image
              source={item.icon}
              resizeMode="contain"
              style={[
                styles.tabIcon,
                {
                  tintColor: isActive ? Colors.textcolor : Colors.mediumGray,
                  marginTop: fh(10),   // ⭐ keeps plus icon at exact original height
                },
                isActive && [styles.activeTabIcon, activeIconStyle],
              ]}
            />

          ) : (
            <Text style={[styles.plusFallback, { color: Colors.mediumGray }]}>+</Text>
          )
        ) : (
          <View style={styles.tabContentColumn}>
            <View style={styles.tabRow}>
              {item.icon && (
                <Image
                  source={item.icon}
                  resizeMode="contain"
                  style={[
                    styles.tabIcon,
                    { tintColor: isActive ? Colors.textcolor : Colors.mediumGray },
                    isActive && [styles.activeTabIcon, activeIconStyle],
                  ]}
                />
              )}
              {!!item.label && (
                <View>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.label,
                      {
                        marginTop: fh(10),   // ⭐ ONLY this moves label **slightly down**
                        color: isActive ? "#FFF" : Colors.mediumGray,
                        fontFamily: 'Inter-Medium',
                      },
                      labelStyle,
                      item.labelStyle,
                      isActive && [styles.activeLabel, activeLabelStyle],
                    ]}
                  >
                    {item.label}
                  </Text>

                </View>

              )}
            </View>
            {isActive && (
              <View
                style={[
                  // styles.activeUnderline,
                  { backgroundColor: Colors.lavenderPurple },
                ]}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.wrapper,
        showBottomBorder && {
          borderBottomColor: Colors.mediumGray,
          borderBottomWidth: 1,
        },
        containerStyle,
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, contentContainerStyle]}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: fw(90),   // 👈 approx tab width (adjust if needed)
          offset: fw(90) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    paddingVertical: fh(getLayoutConfig().isTablet ? 12 : 8),
    // bottom: fh(2),
  },
  scrollContainer: {
    // paddingHorizontal: fw(12),
  },
  plusFallback: {
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
    fontWeight: 'bold',
  },
  tabContentColumn: {
    alignItems: 'flex-start',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fw(getLayoutConfig().isTablet ? 8 : 6),
  },
  tabIcon: {
    width: fw(getLayoutConfig().isTablet ? 22 : 18),
    height: fw(getLayoutConfig().isTablet ? 22 : 18),
    top: fh(1),
  },
  activeTabIcon: {},
  label: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 15),
    lineHeight: fh(getLayoutConfig().isTablet ? 24 : 22),
    includeFontPadding: false,
  },
  activeLabel: {
    fontWeight: '600',
  },
  tab: {
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 8 : 6),
    paddingVertical: fh(getLayoutConfig().isTablet ? 6 : 4),
  },
  activeTab: {},
});

export default TopBar;
