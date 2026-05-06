import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/shared/theme';

interface SectionLabelProps {
  label: string;
  hint?: string;
}

export function SectionLabel({ label, hint }: SectionLabelProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
