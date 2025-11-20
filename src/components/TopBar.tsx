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
import { fw, fh, ff } from '../../utils/responsive';
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
    paddingVertical: fh(8),
    // bottom: fh(2),
  },
  scrollContainer: {
    // paddingHorizontal: fw(12),
  },
  plusFallback: {
    fontSize: ff(18),
    fontWeight: 'bold',
  },
  tabContentColumn: {
    alignItems: 'flex-start',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fw(6),
  },
  tabIcon: {
    width: fw(18),
    height: fw(18),
    top: fh(1),
  },
  activeTabIcon: {},
  label: {
    fontSize: ff(15),
    lineHeight: fh(22)
  },
  activeLabel: {
    fontWeight: '600',
  },
  tab: {
    paddingHorizontal: fw(6),
    paddingVertical: fh(4),
  },
  activeTab: {},
});

export default TopBar;
