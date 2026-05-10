import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import { colors, fonts } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/icons';

export type RolePillRole =
  | MemberRole.OWNER
  | MemberRole.MODERATOR
  | MemberRole.MEMBER
  | 'pending';

interface RolePillProps {
  role: RolePillRole;
  large?: boolean;
}

interface PillSpec {
  label: string;
  icon: IconName;
  color: string;
  bg: string;
  border: string;
}

const SPECS: Record<RolePillRole, PillSpec> = {
  [MemberRole.OWNER]: {
    label: 'PROPRIETÁRIO',
    icon: 'shield',
    color: colors.accent2,
    bg: 'rgba(167,139,250,0.18)',
    border: 'rgba(167,139,250,0.50)',
  },
  [MemberRole.MODERATOR]: {
    label: 'ADMINISTRADOR',
    icon: 'shield',
    color: colors.primary,
    bg: 'rgba(0,209,255,0.18)',
    border: 'rgba(0,209,255,0.50)',
  },
  [MemberRole.MEMBER]: {
    label: 'MEMBRO',
    icon: 'check',
    color: colors.success,
    bg: 'rgba(0,230,118,0.16)',
    border: 'rgba(0,230,118,0.50)',
  },
  pending: {
    label: 'AGUARDANDO',
    icon: 'dot',
    color: colors.dim,
    bg: 'rgba(196,196,196,0.12)',
    border: 'rgba(196,196,196,0.45)',
  },
};

export function RolePill({ role, large }: RolePillProps) {
  const spec = SPECS[role];
  return (
    <View
      style={[
        styles.pill,
        large ? styles.pillLarge : styles.pillSmall,
        {
          backgroundColor: spec.bg,
          borderColor: spec.border,
        },
      ]}
      testID={`role-pill-${role}`}
    >
      <Icon
        name={spec.icon}
        size={large ? 11 : 9}
        color={spec.color}
        strokeWidth={2.2}
      />
      <Text
        style={[
          styles.label,
          large ? styles.labelLarge : styles.labelSmall,
          { color: spec.color },
        ]}
      >
        {spec.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillSmall: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pillLarge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  label: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    letterSpacing: 1,
  },
  labelSmall: {
    fontSize: 9.5,
  },
  labelLarge: {
    fontSize: 10.5,
  },
});
