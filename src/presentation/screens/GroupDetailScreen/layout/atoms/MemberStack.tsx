import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '@/shared/theme';

interface StackMember {
  id: string | number;
  initials: string;
}

interface MemberStackProps {
  members: StackMember[];
  max?: number;
  /** Avatar size; the +N overflow chip matches. */
  size?: number;
}

/**
 * Reserved for the next PR — once members are fetched into the detail screen,
 * pass them in. Until then, the parent passes `members={[]}` and this returns
 * `null` (so the hero subtitle row collapses cleanly to count-only).
 */
export function MemberStack({ members, max = 5, size = 32 }: MemberStackProps) {
  if (members.length === 0) return null;

  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  const radius = size / 2;

  return (
    <View style={styles.row}>
      {shown.map((m, i) => (
        <View
          key={m.id}
          style={[
            styles.avatarWrap,
            {
              width: size,
              height: size,
              borderRadius: radius,
              marginLeft: i === 0 ? 0 : -10,
              zIndex: shown.length - i,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.avatar,
              { width: size, height: size, borderRadius: radius },
            ]}
          >
            <Text style={[styles.label, { fontSize: size * 0.36 }]}>
              {m.initials}
            </Text>
          </LinearGradient>
        </View>
      ))}
      {extra > 0 ? (
        <View
          style={[
            styles.extra,
            {
              width: size,
              height: size,
              borderRadius: radius,
              marginLeft: -10,
            },
          ]}
        >
          <Text style={styles.extraLabel}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderColor: colors.background,
    borderWidth: 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.accentInk,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  extra: {
    backgroundColor: colors.surface2,
    borderColor: colors.background,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.4,
  },
});
