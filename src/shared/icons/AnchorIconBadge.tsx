import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AnchorType } from '@localloop/shared-types';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Icon } from './Icon';
import { anchorIconName } from './anchorIcon';

interface Props {
  anchorType: AnchorType;
  size: number;
  iconSize: number;
  borderRadius: number;
}

export function AnchorIconBadge({
  anchorType,
  size,
  iconSize,
  borderRadius,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.duotoneSoftFrom, colors.duotoneSoftTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.box, { width: size, height: size, borderRadius }]}
    >
      <Icon
        name={anchorIconName(anchorType)}
        size={iconSize}
        color={colors.primary}
        strokeWidth={1.9}
      />
    </LinearGradient>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: {
      borderWidth: 1,
      borderColor: c.anchorTileBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
