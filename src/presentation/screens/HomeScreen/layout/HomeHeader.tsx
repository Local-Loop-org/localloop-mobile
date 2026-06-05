import React from 'react';
import { View, Text } from 'react-native';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

export function HomeHeader() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>LocalLoop</Text>
      <View style={styles.headerActions} />
    </View>
  );
}
