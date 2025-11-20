import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import { fw, fh, ff } from '../../utils/responsive';

interface AppHeaderProps {
  title?: string;
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
  backgroundColor?: string;
  leftComponents?: React.ReactNode[];
  rightComponents?: React.ReactNode[];
  centerComponent?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showBottomDivider?: boolean;

  /** NEW: adds notch-safe top padding */
  safeTopPadding?: boolean; // default: true
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  titleStyle,
  containerStyle,
  backgroundColor = Colors.deepPurple,
  leftComponents,
  rightComponents,
  centerComponent,
  onLeftPress,
  onRightPress,
  showBottomDivider = false,
  safeTopPadding = true,
}) => {
  const insets = useSafeAreaInsets();
  const topPad = safeTopPadding ? insets.top : 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, paddingTop: topPad, height: fh(56) + topPad },
        containerStyle,
        showBottomDivider && styles.divider,
      ]}
    >
      {/* LEFT */}
      <View style={styles.sideContainer}>
          {leftComponents?.map((comp, idx) =>
            onLeftPress ? (
              <TouchableOpacity key={idx} onPress={onLeftPress} style={styles.iconWrapper}>
                {comp}
              </TouchableOpacity>
            ) : (
              <View key={idx} style={styles.iconWrapper}>
                {comp}
              </View>
            )
          )}
        </View>

      {/* CENTER */}
      <View style={styles.centerContainer}>
        {centerComponent ? (
          centerComponent
        ) : (
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      {/* RIGHT */}
      <View style={styles.sideContainer}>
        {rightComponents?.map((comp, idx) =>
          onRightPress ? (
            <TouchableOpacity key={idx} onPress={onRightPress} style={styles.iconWrapper}>
              {comp}
            </TouchableOpacity>
          ) : (
            <View key={idx} style={styles.iconWrapper}>
              {comp}
            </View>
          )
        )}
      </View>
          </View>
        );
      };

const styles = StyleSheet.create({
  container: {
    // height is set dynamically (56 + topPad)
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: fw(12),
    justifyContent: 'space-between',
  },
  sideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: ff(18),
    fontWeight: '600',
    color: Colors.textcolor,
  },
  iconWrapper: {
    paddingHorizontal: fw(4),
    paddingVertical: fh(4),
    marginRight: fw(8),  
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.mediumGray,
  },
});

export default AppHeader;
