import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

export function DaySeparatorItem({ label }: { label: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.separatorWrapper}>
      <Text style={styles.separatorText}>{label}</Text>
    </View>
  );
}
