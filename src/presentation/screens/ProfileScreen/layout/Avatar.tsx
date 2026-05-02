import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/shared/theme';

interface Props {
  name: string;
  uri: string | null;
  size: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  const letters = parts.slice(0, 2).map((part) => part[0] ?? '');
  const joined = letters.join('').toUpperCase();
  return joined.length > 0 ? joined : '?';
}

export default function Avatar({ name, uri, size }: Props) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}
    >
      <LinearGradient
        colors={[colors.primary, colors.accent2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.fill,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <Text style={[styles.letters, { fontSize: Math.round(size * 0.34) }]}>
          {initials(name)}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letters: {
    color: colors.white,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
