import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

export function HomeHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>LocalLoop</Text>
      <View style={styles.headerActions} />
    </View>
  );
}
