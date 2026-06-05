import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { StatusPill, type MemberStatusKind } from './StatusPill';

interface StatusSectionHeaderProps {
  kind: MemberStatusKind;
  count: number;
}

export function StatusSectionHeader({ kind, count }: StatusSectionHeaderProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <StatusPill kind={kind} />
      <View style={styles.rule} />
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.faint,
    letterSpacing: 0.6,
  },
});
