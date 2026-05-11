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
 * Renders up to `max` overlapping gradient avatars with an optional `+N` chip.
 * Returns `null` for an empty list so the parent section can render a fallback
 * (e.g. the MEMBROS placeholder line) without an extra wrapper view.
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
              {
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: 2,
                borderColor: colors.background,
              },
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
  avatarWrap: {},
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
