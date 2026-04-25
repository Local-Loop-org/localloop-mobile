import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/shared/theme';

interface AvatarProps {
  name: string;
  uri: string | null;
  size: number;
}

function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : '?';
}

export default function Avatar({ name, uri, size }: AvatarProps) {
  const radius = size / 2;
  const fontSize = Math.round(size * 0.38);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.accent2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={[styles.letter, { fontSize }]}>{initial(name)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: colors.white,
    fontWeight: '700',
  },
});
