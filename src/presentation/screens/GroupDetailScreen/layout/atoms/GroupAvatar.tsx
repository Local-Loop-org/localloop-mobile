import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnchorType } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
import { Icon, anchorIconName } from '@/shared/icons';

interface GroupAvatarProps {
  anchorType: AnchorType;
  size?: number;
}

/**
 * Squircle gradient with the anchor-type icon centered. The default group "image"
 * until per-group photo upload ships.
 */
export function GroupAvatar({ anchorType, size = 64 }: GroupAvatarProps) {
  const radius = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.4);
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[colors.primary, colors.accent2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.bg,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <Icon
          name={anchorIconName(anchorType)}
          size={iconSize}
          color={colors.accentInk}
          strokeWidth={2}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
