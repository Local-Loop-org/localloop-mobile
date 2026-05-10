import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/icons';

interface StatPillProps {
  icon: IconName;
  label: string;
  value: string | number;
  testID?: string;
}

export function StatPill({ icon, label, value, testID }: StatPillProps) {
  return (
    <View style={styles.pill} testID={testID}>
      <View style={styles.head}>
        <Icon name={icon} size={11} color={colors.dim} strokeWidth={2} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    gap: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.faint,
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
});
