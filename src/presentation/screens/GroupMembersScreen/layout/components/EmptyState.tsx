import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/icons';

interface EmptyStateProps {
  icon: IconName;
  label: string;
}

export function EmptyState({ icon, label }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconDisc}>
        <Icon name={icon} size={18} color={colors.faint} strokeWidth={1.8} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  iconDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: colors.dim,
    textAlign: 'center',
  },
});
