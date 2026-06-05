import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTypography, type ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

export default function MapScreen() {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.label}>Em breve</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => {
  const typography = createTypography(c);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.body,
      color: c.textSecondary,
    },
  });
};
