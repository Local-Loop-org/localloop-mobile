import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { ThemeColors } from '@/shared/theme';

interface AvatarProps {
  name: string | null | undefined;
  uri: string | null;
  size: number;
}

function initial(name: string | null | undefined): string {
  if (!name) return '?';
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : '?';
}

// Reference conversion (Phase-2 template): a shared/ui component reads the live
// palette via useTheme()/useThemedStyles() so it repaints instantly on toggle.
export default function Avatar({ name, uri, size }: AvatarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    letter: {
      color: c.white,
      fontWeight: '700',
    },
  });
