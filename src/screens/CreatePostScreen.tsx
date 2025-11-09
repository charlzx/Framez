import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, fontSize } from '../constants/spacing';

export default function CreatePostScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create Post Screen - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: fontSize.xl,
    color: colors.foreground,
    fontFamily: 'SpaceMono_700Bold',
  },
});
