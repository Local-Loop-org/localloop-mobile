import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import type { ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface CardProps {
  style?: ViewStyle | ViewStyle[];
}

export function Card({ children, style }: PropsWithChildren<CardProps>) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
