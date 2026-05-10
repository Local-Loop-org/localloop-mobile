import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/shared/theme';

interface AvatarProps {
  name: string;
  initials?: string;
  size?: number;
}

function deriveInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, initials, size = 36 }: AvatarProps) {
  const display = (initials ?? deriveInitials(name)) || '?';
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[colors.primary, colors.accent2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bg, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text
          style={[
            styles.label,
            {
              fontSize: size * 0.36,
            },
          ]}
        >
          {display}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.accentInk,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
