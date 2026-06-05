import React from 'react';
import { View } from 'react-native';
import { AnchorType } from '@localloop/shared-types';
import { Icon, anchorIconName } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';

interface AnchorIconProps {
  type: AnchorType;
  size: number;
}

export default function AnchorIcon({ type, size }: AnchorIconProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 11,
        backgroundColor: `${colors.primary}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={anchorIconName(type)} size={17} color={colors.primary} strokeWidth={2} />
    </View>
  );
}
