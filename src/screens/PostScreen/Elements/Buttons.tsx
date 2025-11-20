import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { fw, fh, ff } from "../../../../utils/responsive"

function Buttons({
  customComponent,
  name = 'like2',
  text = 'Like',
  color = 'white',
  size = fw(28),
  onPress,
}) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {customComponent ? (
        customComponent
      ) : (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <AntDesign name={name} color={color} size={size} />
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default Buttons;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: fh(6),
    marginBottom: fh(4),
  },
  text: {
    marginTop: fh(6),
    fontWeight: '400',
    color: "#fff",
    fontSize: ff(12),
  },
});
