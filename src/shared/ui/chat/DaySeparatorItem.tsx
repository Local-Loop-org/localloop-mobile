import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

export function DaySeparatorItem({ label }: { label: string }) {
  return (
    <View style={styles.separatorWrapper}>
      <Text style={styles.separatorText}>{label}</Text>
    </View>
  );
}
