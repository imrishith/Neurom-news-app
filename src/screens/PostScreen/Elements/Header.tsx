import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { fw, fh, ff } from '../../../../utils/responsive';

function Header({
  customComponent,
  customIcon,
  name = 'arrowleft',
  text = 'Reels',
  color = 'white',
  size = fw(24),
  onPress,
}) {
  return (
    <Pressable onPress={onPress}>
      {customComponent ? (
        customComponent
      ) : (
        <View style={styles.container}>
          {customIcon ? null : <AntDesign name={name} color={color} size={size} />}
          <Text style={styles.title}>{text}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default Header;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: fw(10),
    marginLeft: fw(12),
  },
  title: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: ff(18),
    marginLeft: fw(12),
  },
});
