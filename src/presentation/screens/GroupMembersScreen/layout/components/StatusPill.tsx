import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';

export type MemberStatusKind = 'active' | 'pending' | 'banned';

interface StatusPillProps {
  kind: MemberStatusKind;
}

interface PillSpec {
  label: string;
  bg: string;
  border: string;
}

const SPECS: Record<MemberStatusKind, PillSpec> = {
  active: {
    label: 'ATIVO',
    bg: 'rgba(0,230,118,0.18)',
    border: 'rgba(0,230,118,0.50)',
  },
  pending: {
    label: 'PENDENTE',
    bg: 'rgba(240,162,74,0.18)',
    border: 'rgba(240,162,74,0.50)',
  },
  banned: {
    label: 'BANIDO',
    bg: 'rgba(255,75,75,0.18)',
    border: 'rgba(255,75,75,0.50)',
  },
};

const textColorFor = (kind: MemberStatusKind, c: ThemeColors): string =>
  kind === 'active' ? c.success : kind === 'pending' ? c.warning : c.error;

export function StatusPill({ kind }: StatusPillProps) {
  const { colors } = useTheme();
  const spec = SPECS[kind];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: spec.bg, borderColor: spec.border },
      ]}
      testID={`status-pill-${kind}`}
    >
      <Text style={[styles.label, { color: textColorFor(kind, colors) }]}>
        {spec.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
