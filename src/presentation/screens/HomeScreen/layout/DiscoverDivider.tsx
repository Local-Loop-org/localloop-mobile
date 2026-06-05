import React from 'react';
import { View, Text } from 'react-native';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

export function DiscoverDivider() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>DESCOBRIR PERTO DE VOCÊ</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}
