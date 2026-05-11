import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/shared/theme';
import { initialsFor } from '@/shared/format/initials';

interface MemberAvatarProps {
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
}

export function MemberAvatar({ displayName, avatarUrl, size = 28 }: MemberAvatarProps) {
  const radius = size / 2;
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
      />
    );
  }
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
  image: {},
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
