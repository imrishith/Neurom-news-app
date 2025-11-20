import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fw, fh, ff } from '../../utils/responsive';
import { useTheme } from '../context/ThemeContext'; // ✅ import theme hook
import { Linking } from "react-native";
import { handleBottomBarLayout } from '../../utils/layoutUtils';
import FastImage from "react-native-fast-image";
type BarItem = {
  key: string;
  label?: string;
  routeName: string;      // must match screen in your stack
  iconSource: any;
  iconSize?: number;
  activeIconSize?: number;
  iconStyle?: ImageStyle;
  activeIconStyle?: ImageStyle;
};

interface BottomBarProps {
  items: BarItem[];
  showLabels?: boolean;
  containerStyle?: any;
  barStyle?: any;
  activeRouteName: string;
}

const Bottombar: React.FC<BottomBarProps> = ({
  items,
  showLabels = false,
  containerStyle,
  barStyle,
  activeRouteName,
}) => {
  const navigation = useNavigation<any>();
  const { Colors } = useTheme(); // ✅ use theme colors

  return (
    
      <View onLayout={handleBottomBarLayout} style={[styles.wrap, { backgroundColor: Colors.darkpurple }, barStyle]}>
        {items.map((item) => {
          const active = activeRouteName === item.routeName;
          const size = active ? item.activeIconSize ?? item.iconSize : item.iconSize;
          const sizeStyle = size ? { width: fw(size), height: fw(size) } : null;

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tab}
              activeOpacity={0.9}
               onPress={() => {
                if (item.routeName === "ReportForm") {
                  // 👇 Open Google Form in external browser
                  Linking.openURL("https://docs.google.com/forms/d/e/1FAIpQLSdeVV_AfdP8hjxwprHJEXWjUB5X6zX57ZA0Fi7jruo8nwRG_Q/viewform?usp=header");
                } else if (!active) {
                  navigation.navigate('Main', { screen: item.routeName });
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Image
                source={item.iconSource}
                style={[
                  styles.icon,
                  sizeStyle,
                  item.iconStyle,
                  active && item.activeIconStyle,
                  {
                    tintColor: active ? Colors.lavenderPurple : Colors.textcolor,
                  },
                ]}
                resizeMode="contain"
              />
              {showLabels && (
                <Text
                  style={[
                    styles.label,
                    { color: active ? Colors.lavenderPurple : Colors.textcolor },
                  ]}
                  numberOfLines={1}
                >
                  {item.label ?? item.key}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

  );
};

const styles = StyleSheet.create({
  wrap: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: fh(65),   // your fixed bar height is fine
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  paddingHorizontal: fw(8),
  borderTopWidth: StyleSheet.hairlineWidth,
  ...Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: { elevation: 12 },
  }),
},
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: fh(4), paddingBottom: fh(16),  },
  icon: { width: fw(20), height: fw(20) },
  label: { fontSize: ff(10) },
});

export default memo(Bottombar);
