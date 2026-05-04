import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AnchorType } from '@localloop/shared-types';
import { Icon } from './Icon';
import { anchorIconName } from './anchorIcon';
import { colors } from '@/shared/theme';

export const ANCHOR_BADGE_GRADIENT: readonly [string, string] = [
  'rgba(0, 209, 255, 0.16)',
  'rgba(167, 139, 250, 0.16)',
];

export const ANCHOR_BADGE_BORDER_COLOR = 'rgba(0, 209, 255, 0.2)';

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
  return (
    <LinearGradient
      colors={ANCHOR_BADGE_GRADIENT}
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

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: ANCHOR_BADGE_BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
