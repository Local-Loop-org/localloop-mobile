import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface FieldLabelProps {
  label: string;
  hint?: string;
}

export function FieldLabel({ label, hint }: FieldLabelProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: colors.dim,
    letterSpacing: 1.4,
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: colors.faint,
    letterSpacing: 0.6,
  },
});
