import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SectionLabelProps {
  label: string;
  hint?: string;
  /** Optional element rendered at the row end (e.g. a "VER TODOS" pressable). */
  action?: React.ReactNode;
}

export function SectionLabel({ label, hint, action }: SectionLabelProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {action
        ? action
        : hint
          ? <Text style={styles.hint}>{hint}</Text>
          : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: colors.faint,
    letterSpacing: 1.6,
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: colors.faint,
    letterSpacing: 0.6,
  },
});
