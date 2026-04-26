import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

export function DiscoverDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>DESCOBRIR PERTO DE VOCÊ</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}
