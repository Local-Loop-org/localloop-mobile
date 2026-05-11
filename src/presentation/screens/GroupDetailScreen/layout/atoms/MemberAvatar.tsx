import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/shared/theme';
import { initialsFor } from '@/shared/format/initials';

interface MemberAvatarProps {
  displayName: string;
  size?: number;
}

export function MemberAvatar({ displayName, size = 28 }: MemberAvatarProps) {
  const radius = size / 2;
  return (
    <LinearGradient
      colors={[colors.primary, colors.accent2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={[styles.label, { fontSize: size * 0.4 }]}>
        {initialsFor(displayName)}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.accentInk,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
